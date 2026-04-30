package p2panda_ffi

// #include <p2panda_ffi.h>
import "C"

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"math"
	"reflect"
	"runtime"
	"runtime/cgo"
	"sync"
	"sync/atomic"
	"unsafe"
)

// This is needed, because as of go 1.24
// type RustBuffer C.RustBuffer cannot have methods,
// RustBuffer is treated as non-local type
type GoRustBuffer struct {
	inner C.RustBuffer
}

type RustBufferI interface {
	AsReader() *bytes.Reader
	Free()
	ToGoBytes() []byte
	Data() unsafe.Pointer
	Len() uint64
	Capacity() uint64
}

// C.RustBuffer fields exposed as an interface so they can be accessed in different Go packages.
// See https://github.com/golang/go/issues/13467
type ExternalCRustBuffer interface {
	Data() unsafe.Pointer
	Len() uint64
	Capacity() uint64
}

func RustBufferFromC(b C.RustBuffer) ExternalCRustBuffer {
	return GoRustBuffer{
		inner: b,
	}
}

func CFromRustBuffer(b ExternalCRustBuffer) C.RustBuffer {
	return C.RustBuffer{
		capacity: C.uint64_t(b.Capacity()),
		len:      C.uint64_t(b.Len()),
		data:     (*C.uchar)(b.Data()),
	}
}

func RustBufferFromExternal(b ExternalCRustBuffer) GoRustBuffer {
	return GoRustBuffer{
		inner: C.RustBuffer{
			capacity: C.uint64_t(b.Capacity()),
			len:      C.uint64_t(b.Len()),
			data:     (*C.uchar)(b.Data()),
		},
	}
}

func (cb GoRustBuffer) Capacity() uint64 {
	return uint64(cb.inner.capacity)
}

func (cb GoRustBuffer) Len() uint64 {
	return uint64(cb.inner.len)
}

func (cb GoRustBuffer) Data() unsafe.Pointer {
	return unsafe.Pointer(cb.inner.data)
}

func (cb GoRustBuffer) AsReader() *bytes.Reader {
	b := unsafe.Slice((*byte)(cb.inner.data), C.uint64_t(cb.inner.len))
	return bytes.NewReader(b)
}

func (cb GoRustBuffer) Free() {
	rustCall(func(status *C.RustCallStatus) bool {
		C.ffi_p2panda_ffi_rustbuffer_free(cb.inner, status)
		return false
	})
}

func (cb GoRustBuffer) ToGoBytes() []byte {
	return C.GoBytes(unsafe.Pointer(cb.inner.data), C.int(cb.inner.len))
}

func stringToRustBuffer(str string) C.RustBuffer {
	return bytesToRustBuffer([]byte(str))
}

func bytesToRustBuffer(b []byte) C.RustBuffer {
	if len(b) == 0 {
		return C.RustBuffer{}
	}
	// We can pass the pointer along here, as it is pinned
	// for the duration of this call
	foreign := C.ForeignBytes{
		len:  C.int(len(b)),
		data: (*C.uchar)(unsafe.Pointer(&b[0])),
	}

	return rustCall(func(status *C.RustCallStatus) C.RustBuffer {
		return C.ffi_p2panda_ffi_rustbuffer_from_bytes(foreign, status)
	})
}

type BufLifter[GoType any] interface {
	Lift(value RustBufferI) GoType
}

type BufLowerer[GoType any] interface {
	Lower(value GoType) C.RustBuffer
}

type BufReader[GoType any] interface {
	Read(reader io.Reader) GoType
}

type BufWriter[GoType any] interface {
	Write(writer io.Writer, value GoType)
}

func LowerIntoRustBuffer[GoType any](bufWriter BufWriter[GoType], value GoType) C.RustBuffer {
	// This might be not the most efficient way but it does not require knowing allocation size
	// beforehand
	var buffer bytes.Buffer
	bufWriter.Write(&buffer, value)

	bytes, err := io.ReadAll(&buffer)
	if err != nil {
		panic(fmt.Errorf("reading written data: %w", err))
	}
	return bytesToRustBuffer(bytes)
}

func LiftFromRustBuffer[GoType any](bufReader BufReader[GoType], rbuf RustBufferI) GoType {
	defer rbuf.Free()
	reader := rbuf.AsReader()
	item := bufReader.Read(reader)
	if reader.Len() > 0 {
		// TODO: Remove this
		leftover, _ := io.ReadAll(reader)
		panic(fmt.Errorf("Junk remaining in buffer after lifting: %s", string(leftover)))
	}
	return item
}

func rustCallWithError[E any, U any](converter BufReader[E], callback func(*C.RustCallStatus) U) (U, E) {
	var status C.RustCallStatus
	returnValue := callback(&status)
	err := checkCallStatus(converter, status)
	return returnValue, err
}

func checkCallStatus[E any](converter BufReader[E], status C.RustCallStatus) E {
	switch status.code {
	case 0:
		var zero E
		return zero
	case 1:
		return LiftFromRustBuffer(converter, GoRustBuffer{inner: status.errorBuf})
	case 2:
		// when the rust code sees a panic, it tries to construct a rustBuffer
		// with the message.  but if that code panics, then it just sends back
		// an empty buffer.
		if status.errorBuf.len > 0 {
			panic(fmt.Errorf("%s", FfiConverterStringINSTANCE.Lift(GoRustBuffer{inner: status.errorBuf})))
		} else {
			panic(fmt.Errorf("Rust panicked while handling Rust panic"))
		}
	default:
		panic(fmt.Errorf("unknown status code: %d", status.code))
	}
}

func checkCallStatusUnknown(status C.RustCallStatus) error {
	switch status.code {
	case 0:
		return nil
	case 1:
		panic(fmt.Errorf("function not returning an error returned an error"))
	case 2:
		// when the rust code sees a panic, it tries to construct a C.RustBuffer
		// with the message.  but if that code panics, then it just sends back
		// an empty buffer.
		if status.errorBuf.len > 0 {
			panic(fmt.Errorf("%s", FfiConverterStringINSTANCE.Lift(GoRustBuffer{
				inner: status.errorBuf,
			})))
		} else {
			panic(fmt.Errorf("Rust panicked while handling Rust panic"))
		}
	default:
		return fmt.Errorf("unknown status code: %d", status.code)
	}
}

func rustCall[U any](callback func(*C.RustCallStatus) U) U {
	returnValue, err := rustCallWithError[error](nil, callback)
	if err != nil {
		panic(err)
	}
	return returnValue
}

type NativeError interface {
	AsError() error
}

func writeInt8(writer io.Writer, value int8) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeUint8(writer io.Writer, value uint8) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeInt16(writer io.Writer, value int16) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeUint16(writer io.Writer, value uint16) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeInt32(writer io.Writer, value int32) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeUint32(writer io.Writer, value uint32) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeInt64(writer io.Writer, value int64) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeUint64(writer io.Writer, value uint64) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeFloat32(writer io.Writer, value float32) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func writeFloat64(writer io.Writer, value float64) {
	if err := binary.Write(writer, binary.BigEndian, value); err != nil {
		panic(err)
	}
}

func readInt8(reader io.Reader) int8 {
	var result int8
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readUint8(reader io.Reader) uint8 {
	var result uint8
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readInt16(reader io.Reader) int16 {
	var result int16
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readUint16(reader io.Reader) uint16 {
	var result uint16
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readInt32(reader io.Reader) int32 {
	var result int32
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readUint32(reader io.Reader) uint32 {
	var result uint32
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readInt64(reader io.Reader) int64 {
	var result int64
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readUint64(reader io.Reader) uint64 {
	var result uint64
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readFloat32(reader io.Reader) float32 {
	var result float32
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func readFloat64(reader io.Reader) float64 {
	var result float64
	if err := binary.Read(reader, binary.BigEndian, &result); err != nil {
		panic(err)
	}
	return result
}

func init() {

	FfiConverterEphemeralStreamCallbackINSTANCE.register()
	FfiConverterTopicStreamCallbackINSTANCE.register()
	uniffiCheckChecksums()
}

func uniffiCheckChecksums() {
	// Get the bindings contract version from our ComponentInterface
	bindingsContractVersion := 30
	// Get the scaffolding contract version by calling the into the dylib
	scaffoldingContractVersion := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint32_t {
		return C.ffi_p2panda_ffi_uniffi_contract_version()
	})
	if bindingsContractVersion != int(scaffoldingContractVersion) {
		// If this happens try cleaning and rebuilding your project
		panic("p2panda_ffi: UniFFI contract version mismatch")
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy()
		})
		if checksum != 19922 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4()
		})
		if checksum != 13056 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6()
		})
		if checksum != 60847 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4()
		})
		if checksum != 19546 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6()
		})
		if checksum != 43790 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap()
		})
		if checksum != 42251 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url()
		})
		if checksum != 57213 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode()
		})
		if checksum != 56351 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id()
		})
		if checksum != 25341 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key()
		})
		if checksum != 55001 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url()
		})
		if checksum != 60407 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn()
		})
		if checksum != 44540 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_cursor_name()
		})
		if checksum != 43705 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_cursor_name: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_hash_to_bytes()
		})
		if checksum != 61881 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_hash_to_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_hash_to_hex()
		})
		if checksum != 52106 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_hash_to_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_backlink()
		})
		if checksum != 19728 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_backlink: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_hash()
		})
		if checksum != 328 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_hash: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_log_id()
		})
		if checksum != 13882 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_log_id: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_payload_hash()
		})
		if checksum != 46060 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_payload_hash: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_payload_size()
		})
		if checksum != 63083 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_payload_size: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_prune_flag()
		})
		if checksum != 18333 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_prune_flag: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_public_key()
		})
		if checksum != 13290 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_public_key: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_seq_num()
		})
		if checksum != 41915 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_seq_num: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_signature()
		})
		if checksum != 51488 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_signature: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_timestamp()
		})
		if checksum != 468 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_timestamp: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_header_version()
		})
		if checksum != 39499 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_header_version: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_networkid_to_bytes()
		})
		if checksum != 64224 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_networkid_to_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_networkid_to_hex()
		})
		if checksum != 62120 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_networkid_to_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_privatekey_public_key()
		})
		if checksum != 36762 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_privatekey_public_key: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_privatekey_sign()
		})
		if checksum != 16842 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_privatekey_sign: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes()
		})
		if checksum != 28452 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_privatekey_to_hex()
		})
		if checksum != 34482 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_privatekey_to_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_publickey_to_bytes()
		})
		if checksum != 23757 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_publickey_to_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_publickey_to_hex()
		})
		if checksum != 31307 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_publickey_to_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_publickey_verify()
		})
		if checksum != 27867 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_publickey_verify: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_relayurl_to_str()
		})
		if checksum != 47854 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_relayurl_to_str: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_signature_to_bytes()
		})
		if checksum != 50852 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_signature_to_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_signature_to_hex()
		})
		if checksum != 43786 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_signature_to_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicid_to_bytes()
		})
		if checksum != 63194 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicid_to_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicid_to_hex()
		})
		if checksum != 29111 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicid_to_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author()
		})
		if checksum != 52355 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body()
		})
		if checksum != 33930 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp()
		})
		if checksum != 55567 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic()
		})
		if checksum != 61410 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish()
		})
		if checksum != 48773 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic()
		})
		if checksum != 11085 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message()
		})
		if checksum != 18635 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream()
		})
		if checksum != 19494 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_node_id()
		})
		if checksum != 45319 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_node_id: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap()
		})
		if checksum != 19201 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_node_network_id()
		})
		if checksum != 50875 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_node_network_id: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_node_stream()
		})
		if checksum != 52148 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_node_stream: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_node_stream_from()
		})
		if checksum != 17067 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_node_stream_from: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event()
		})
		if checksum != 30815 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error()
		})
		if checksum != 39094 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation()
		})
		if checksum != 23156 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_event_body()
		})
		if checksum != 611 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_event_body: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_event_header()
		})
		if checksum != 64065 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_event_header: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_event_is_completed()
		})
		if checksum != 17564 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_event_is_completed: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_event_is_failed()
		})
		if checksum != 59684 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_event_is_failed: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_ack()
		})
		if checksum != 34154 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_ack: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_author()
		})
		if checksum != 17427 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_author: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_id()
		})
		if checksum != 16528 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_id: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_message()
		})
		if checksum != 4804 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_message: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_processed()
		})
		if checksum != 21564 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_processed: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp()
		})
		if checksum != 6001 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_processedoperation_topic()
		})
		if checksum != 8589 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_processedoperation_topic: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstream_ack()
		})
		if checksum != 2763 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstream_ack: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstream_prune()
		})
		if checksum != 42833 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstream_prune: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstream_publish()
		})
		if checksum != 12423 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstream_publish: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_method_topicstream_topic()
		})
		if checksum != 54824 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_method_topicstream_topic: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new()
		})
		if checksum != 50633 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_hash_digest()
		})
		if checksum != 40866 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_hash_digest: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes()
		})
		if checksum != 43591 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_hash_from_hex()
		})
		if checksum != 30875 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_hash_from_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes()
		})
		if checksum != 51171 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash()
		})
		if checksum != 61064 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex()
		})
		if checksum != 51136 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_networkid_random()
		})
		if checksum != 20320 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_networkid_random: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes()
		})
		if checksum != 9528 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex()
		})
		if checksum != 18057 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_privatekey_generate()
		})
		if checksum != 31662 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_privatekey_generate: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes()
		})
		if checksum != 34513 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex()
		})
		if checksum != 51719 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str()
		})
		if checksum != 25654 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes()
		})
		if checksum != 42530 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_signature_from_hex()
		})
		if checksum != 59832 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_signature_from_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes()
		})
		if checksum != 16286 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash()
		})
		if checksum != 34777 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex()
		})
		if checksum != 27303 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_topicid_random()
		})
		if checksum != 8969 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_topicid_random: UniFFI API checksum mismatch")
		}
	}
	{
		checksum := rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint16_t {
			return C.uniffi_p2panda_ffi_checksum_constructor_node_spawn()
		})
		if checksum != 35164 {
			// If this happens try cleaning and rebuilding your project
			panic("p2panda_ffi: uniffi_p2panda_ffi_checksum_constructor_node_spawn: UniFFI API checksum mismatch")
		}
	}
}

type FfiConverterUint16 struct{}

var FfiConverterUint16INSTANCE = FfiConverterUint16{}

func (FfiConverterUint16) Lower(value uint16) C.uint16_t {
	return C.uint16_t(value)
}

func (FfiConverterUint16) Write(writer io.Writer, value uint16) {
	writeUint16(writer, value)
}

func (FfiConverterUint16) Lift(value C.uint16_t) uint16 {
	return uint16(value)
}

func (FfiConverterUint16) Read(reader io.Reader) uint16 {
	return readUint16(reader)
}

type FfiDestroyerUint16 struct{}

func (FfiDestroyerUint16) Destroy(_ uint16) {}

type FfiConverterUint64 struct{}

var FfiConverterUint64INSTANCE = FfiConverterUint64{}

func (FfiConverterUint64) Lower(value uint64) C.uint64_t {
	return C.uint64_t(value)
}

func (FfiConverterUint64) Write(writer io.Writer, value uint64) {
	writeUint64(writer, value)
}

func (FfiConverterUint64) Lift(value C.uint64_t) uint64 {
	return uint64(value)
}

func (FfiConverterUint64) Read(reader io.Reader) uint64 {
	return readUint64(reader)
}

type FfiDestroyerUint64 struct{}

func (FfiDestroyerUint64) Destroy(_ uint64) {}

type FfiConverterBool struct{}

var FfiConverterBoolINSTANCE = FfiConverterBool{}

func (FfiConverterBool) Lower(value bool) C.int8_t {
	if value {
		return C.int8_t(1)
	}
	return C.int8_t(0)
}

func (FfiConverterBool) Write(writer io.Writer, value bool) {
	if value {
		writeInt8(writer, 1)
	} else {
		writeInt8(writer, 0)
	}
}

func (FfiConverterBool) Lift(value C.int8_t) bool {
	return value != 0
}

func (FfiConverterBool) Read(reader io.Reader) bool {
	return readInt8(reader) != 0
}

type FfiDestroyerBool struct{}

func (FfiDestroyerBool) Destroy(_ bool) {}

type FfiConverterString struct{}

var FfiConverterStringINSTANCE = FfiConverterString{}

func (FfiConverterString) Lift(rb RustBufferI) string {
	defer rb.Free()
	reader := rb.AsReader()
	b, err := io.ReadAll(reader)
	if err != nil {
		panic(fmt.Errorf("reading reader: %w", err))
	}
	return string(b)
}

func (FfiConverterString) Read(reader io.Reader) string {
	length := readInt32(reader)
	buffer := make([]byte, length)
	read_length, err := reader.Read(buffer)
	if err != nil && err != io.EOF {
		panic(err)
	}
	if read_length != int(length) {
		panic(fmt.Errorf("bad read length when reading string, expected %d, read %d", length, read_length))
	}
	return string(buffer)
}

func (FfiConverterString) Lower(value string) C.RustBuffer {
	return stringToRustBuffer(value)
}

func (c FfiConverterString) LowerExternal(value string) ExternalCRustBuffer {
	return RustBufferFromC(stringToRustBuffer(value))
}

func (FfiConverterString) Write(writer io.Writer, value string) {
	if len(value) > math.MaxInt32 {
		panic("String is too large to fit into Int32")
	}

	writeInt32(writer, int32(len(value)))
	write_length, err := io.WriteString(writer, value)
	if err != nil {
		panic(err)
	}
	if write_length != len(value) {
		panic(fmt.Errorf("bad write length when writing string, expected %d, written %d", len(value), write_length))
	}
}

type FfiDestroyerString struct{}

func (FfiDestroyerString) Destroy(_ string) {}

type FfiConverterBytes struct{}

var FfiConverterBytesINSTANCE = FfiConverterBytes{}

func (c FfiConverterBytes) Lower(value []byte) C.RustBuffer {
	return LowerIntoRustBuffer[[]byte](c, value)
}

func (c FfiConverterBytes) LowerExternal(value []byte) ExternalCRustBuffer {
	return RustBufferFromC(c.Lower(value))
}

func (c FfiConverterBytes) Write(writer io.Writer, value []byte) {
	if len(value) > math.MaxInt32 {
		panic("[]byte is too large to fit into Int32")
	}

	writeInt32(writer, int32(len(value)))
	write_length, err := writer.Write(value)
	if err != nil {
		panic(err)
	}
	if write_length != len(value) {
		panic(fmt.Errorf("bad write length when writing []byte, expected %d, written %d", len(value), write_length))
	}
}

func (c FfiConverterBytes) Lift(rb RustBufferI) []byte {
	return LiftFromRustBuffer[[]byte](c, rb)
}

func (c FfiConverterBytes) Read(reader io.Reader) []byte {
	length := readInt32(reader)
	buffer := make([]byte, length)
	read_length, err := reader.Read(buffer)
	if err != nil && err != io.EOF {
		panic(err)
	}
	if read_length != int(length) {
		panic(fmt.Errorf("bad read length when reading []byte, expected %d, read %d", length, read_length))
	}
	return buffer
}

type FfiDestroyerBytes struct{}

func (FfiDestroyerBytes) Destroy(_ []byte) {}

// Below is an implementation of synchronization requirements outlined in the link.
// https://github.com/mozilla/uniffi-rs/blob/0dc031132d9493ca812c3af6e7dd60ad2ea95bf0/uniffi_bindgen/src/bindings/kotlin/templates/ObjectRuntime.kt#L31

type FfiObject struct {
	handle        C.uint64_t
	callCounter   atomic.Int64
	cloneFunction func(C.uint64_t, *C.RustCallStatus) C.uint64_t
	freeFunction  func(C.uint64_t, *C.RustCallStatus)
	destroyed     atomic.Bool
}

func newFfiObject(
	handle C.uint64_t,
	cloneFunction func(C.uint64_t, *C.RustCallStatus) C.uint64_t,
	freeFunction func(C.uint64_t, *C.RustCallStatus),
) FfiObject {
	return FfiObject{
		handle:        handle,
		cloneFunction: cloneFunction,
		freeFunction:  freeFunction,
	}
}

func (ffiObject *FfiObject) incrementPointer(debugName string) C.uint64_t {
	for {
		counter := ffiObject.callCounter.Load()
		if counter <= -1 {
			panic(fmt.Errorf("%v object has already been destroyed", debugName))
		}
		if counter == math.MaxInt64 {
			panic(fmt.Errorf("%v object call counter would overflow", debugName))
		}
		if ffiObject.callCounter.CompareAndSwap(counter, counter+1) {
			break
		}
	}

	return rustCall(func(status *C.RustCallStatus) C.uint64_t {
		return ffiObject.cloneFunction(ffiObject.handle, status)
	})
}

func (ffiObject *FfiObject) decrementPointer() {
	if ffiObject.callCounter.Add(-1) == -1 {
		ffiObject.freeRustArcPtr()
	}
}

func (ffiObject *FfiObject) destroy() {
	if ffiObject.destroyed.CompareAndSwap(false, true) {
		if ffiObject.callCounter.Add(-1) == -1 {
			ffiObject.freeRustArcPtr()
		}
	}
}

func (ffiObject *FfiObject) freeRustArcPtr() {
	if ffiObject.handle == 0 {
		return
	}
	rustCall(func(status *C.RustCallStatus) int32 {
		ffiObject.freeFunction(ffiObject.handle, status)
		return 0
	})
}

type CursorInterface interface {
	Name() string
}
type Cursor struct {
	ffiObject FfiObject
}

func (_self *Cursor) Name() string {
	_pointer := _self.ffiObject.incrementPointer("*Cursor")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_cursor_name(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *Cursor) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterCursor struct{}

var FfiConverterCursorINSTANCE = FfiConverterCursor{}

func (c FfiConverterCursor) Lift(handle C.uint64_t) *Cursor {
	result := &Cursor{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_cursor(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_cursor(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*Cursor).Destroy)
	return result
}

func (c FfiConverterCursor) Read(reader io.Reader) *Cursor {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterCursor) Lower(value *Cursor) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*Cursor")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterCursor) Write(writer io.Writer, value *Cursor) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalCursor(handle uint64) *Cursor {
	return FfiConverterCursorINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalCursor(value *Cursor) uint64 {
	return uint64(FfiConverterCursorINSTANCE.Lower(value))
}

type FfiDestroyerCursor struct{}

func (_ FfiDestroyerCursor) Destroy(value *Cursor) {
	value.Destroy()
}

type EphemeralMessageInterface interface {
	Author() *PublicKey
	Body() []byte
	Timestamp() uint64
	Topic() *TopicId
}
type EphemeralMessage struct {
	ffiObject FfiObject
}

func (_self *EphemeralMessage) Author() *PublicKey {
	_pointer := _self.ffiObject.incrementPointer("*EphemeralMessage")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterPublicKeyINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_ephemeralmessage_author(
			_pointer, _uniffiStatus)
	}))
}

func (_self *EphemeralMessage) Body() []byte {
	_pointer := _self.ffiObject.incrementPointer("*EphemeralMessage")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_ephemeralmessage_body(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *EphemeralMessage) Timestamp() uint64 {
	_pointer := _self.ffiObject.incrementPointer("*EphemeralMessage")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterUint64INSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp(
			_pointer, _uniffiStatus)
	}))
}

func (_self *EphemeralMessage) Topic() *TopicId {
	_pointer := _self.ffiObject.incrementPointer("*EphemeralMessage")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterTopicIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic(
			_pointer, _uniffiStatus)
	}))
}
func (object *EphemeralMessage) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterEphemeralMessage struct{}

var FfiConverterEphemeralMessageINSTANCE = FfiConverterEphemeralMessage{}

func (c FfiConverterEphemeralMessage) Lift(handle C.uint64_t) *EphemeralMessage {
	result := &EphemeralMessage{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_ephemeralmessage(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_ephemeralmessage(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*EphemeralMessage).Destroy)
	return result
}

func (c FfiConverterEphemeralMessage) Read(reader io.Reader) *EphemeralMessage {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterEphemeralMessage) Lower(value *EphemeralMessage) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*EphemeralMessage")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterEphemeralMessage) Write(writer io.Writer, value *EphemeralMessage) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalEphemeralMessage(handle uint64) *EphemeralMessage {
	return FfiConverterEphemeralMessageINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalEphemeralMessage(value *EphemeralMessage) uint64 {
	return uint64(FfiConverterEphemeralMessageINSTANCE.Lower(value))
}

type FfiDestroyerEphemeralMessage struct{}

func (_ FfiDestroyerEphemeralMessage) Destroy(value *EphemeralMessage) {
	value.Destroy()
}

type EphemeralStreamInterface interface {
	Publish(message []byte) error
	Topic() *TopicId
}
type EphemeralStream struct {
	ffiObject FfiObject
}

func (_self *EphemeralStream) Publish(message []byte) error {
	_pointer := _self.ffiObject.incrementPointer("*EphemeralStream")
	defer _self.ffiObject.decrementPointer()
	_, err := uniffiRustCallAsync[*EphemeralPublishError](
		FfiConverterEphemeralPublishErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) struct{} {
			C.ffi_p2panda_ffi_rust_future_complete_void(handle, status)
			return struct{}{}
		},
		// liftFn
		func(_ struct{}) struct{} { return struct{}{} },
		C.uniffi_p2panda_ffi_fn_method_ephemeralstream_publish(
			_pointer, FfiConverterBytesINSTANCE.Lower(message)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_void(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_void(handle)
		},
	)

	if err == nil {
		return nil
	}

	return err
}

func (_self *EphemeralStream) Topic() *TopicId {
	_pointer := _self.ffiObject.incrementPointer("*EphemeralStream")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterTopicIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_ephemeralstream_topic(
			_pointer, _uniffiStatus)
	}))
}
func (object *EphemeralStream) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterEphemeralStream struct{}

var FfiConverterEphemeralStreamINSTANCE = FfiConverterEphemeralStream{}

func (c FfiConverterEphemeralStream) Lift(handle C.uint64_t) *EphemeralStream {
	result := &EphemeralStream{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_ephemeralstream(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_ephemeralstream(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*EphemeralStream).Destroy)
	return result
}

func (c FfiConverterEphemeralStream) Read(reader io.Reader) *EphemeralStream {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterEphemeralStream) Lower(value *EphemeralStream) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*EphemeralStream")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterEphemeralStream) Write(writer io.Writer, value *EphemeralStream) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalEphemeralStream(handle uint64) *EphemeralStream {
	return FfiConverterEphemeralStreamINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalEphemeralStream(value *EphemeralStream) uint64 {
	return uint64(FfiConverterEphemeralStreamINSTANCE.Lower(value))
}

type FfiDestroyerEphemeralStream struct{}

func (_ FfiDestroyerEphemeralStream) Destroy(value *EphemeralStream) {
	value.Destroy()
}

type EphemeralStreamCallback interface {
	OnMessage(message *EphemeralMessage)
}
type EphemeralStreamCallbackImpl struct {
	ffiObject FfiObject
}

func (_self *EphemeralStreamCallbackImpl) OnMessage(message *EphemeralMessage) {
	_pointer := _self.ffiObject.incrementPointer("EphemeralStreamCallback")
	defer _self.ffiObject.decrementPointer()
	rustCall(func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message(
			_pointer, FfiConverterEphemeralMessageINSTANCE.Lower(message), _uniffiStatus)
		return false
	})
}
func (object *EphemeralStreamCallbackImpl) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterEphemeralStreamCallback struct {
	handleMap *concurrentHandleMap[EphemeralStreamCallback]
}

var FfiConverterEphemeralStreamCallbackINSTANCE = FfiConverterEphemeralStreamCallback{
	handleMap: newConcurrentHandleMap[EphemeralStreamCallback](),
}

func (c FfiConverterEphemeralStreamCallback) Lift(handle C.uint64_t) EphemeralStreamCallback {
	if uint64(handle)&1 == 0 {
		// Rust-generated handle (even), construct a new object wrapping the handle
		result := &EphemeralStreamCallbackImpl{
			newFfiObject(
				handle,
				func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
					return C.uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(handle, status)
				},
				func(handle C.uint64_t, status *C.RustCallStatus) {
					C.uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(handle, status)
				},
			),
		}
		runtime.SetFinalizer(result, (*EphemeralStreamCallbackImpl).Destroy)
		return result
	} else {
		// Go-generated handle (odd), retrieve from the handle map
		val, ok := c.handleMap.tryGet(uint64(handle))
		if !ok {
			panic(fmt.Errorf("no callback in handle map: %d", handle))
		}
		c.handleMap.remove(uint64(handle))
		return val
	}
}

func (c FfiConverterEphemeralStreamCallback) Read(reader io.Reader) EphemeralStreamCallback {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterEphemeralStreamCallback) Lower(value EphemeralStreamCallback) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	if val, ok := value.(*EphemeralStreamCallbackImpl); ok {
		// Rust-backed object, clone the handle
		handle := val.ffiObject.incrementPointer("EphemeralStreamCallback")
		defer val.ffiObject.decrementPointer()
		return handle
	} else {
		// Go-backed object, insert into handle map
		return C.uint64_t(c.handleMap.insert(value))
	}
}

func (c FfiConverterEphemeralStreamCallback) Write(writer io.Writer, value EphemeralStreamCallback) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalEphemeralStreamCallback(handle uint64) EphemeralStreamCallback {
	return FfiConverterEphemeralStreamCallbackINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalEphemeralStreamCallback(value EphemeralStreamCallback) uint64 {
	return uint64(FfiConverterEphemeralStreamCallbackINSTANCE.Lower(value))
}

type FfiDestroyerEphemeralStreamCallback struct{}

func (_ FfiDestroyerEphemeralStreamCallback) Destroy(value EphemeralStreamCallback) {
	if val, ok := value.(*EphemeralStreamCallbackImpl); ok {
		val.Destroy()
	}
}

type uniffiCallbackResult C.int8_t

const (
	uniffiIdxCallbackFree               uniffiCallbackResult = 0
	uniffiCallbackResultSuccess         uniffiCallbackResult = 0
	uniffiCallbackResultError           uniffiCallbackResult = 1
	uniffiCallbackUnexpectedResultError uniffiCallbackResult = 2
	uniffiCallbackCancelled             uniffiCallbackResult = 3
)

type concurrentHandleMap[T any] struct {
	handles       map[uint64]T
	currentHandle uint64
	lock          sync.RWMutex
}

func newConcurrentHandleMap[T any]() *concurrentHandleMap[T] {
	return &concurrentHandleMap[T]{
		handles:       map[uint64]T{},
		currentHandle: 1,
	}
}

func (cm *concurrentHandleMap[T]) insert(obj T) uint64 {
	cm.lock.Lock()
	defer cm.lock.Unlock()

	handle := cm.currentHandle
	cm.currentHandle = cm.currentHandle + 2
	cm.handles[handle] = obj
	return handle
}

func (cm *concurrentHandleMap[T]) remove(handle uint64) {
	cm.lock.Lock()
	defer cm.lock.Unlock()

	delete(cm.handles, handle)
}

func (cm *concurrentHandleMap[T]) tryGet(handle uint64) (T, bool) {
	cm.lock.RLock()
	defer cm.lock.RUnlock()

	val, ok := cm.handles[handle]
	return val, ok
}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackMethod0
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackMethod0(uniffiHandle C.uint64_t, message C.uint64_t, uniffiOutReturn *C.void, callStatus *C.RustCallStatus) {
	handle := uint64(uniffiHandle)
	uniffiObj, ok := FfiConverterEphemeralStreamCallbackINSTANCE.handleMap.tryGet(handle)
	if !ok {
		panic(fmt.Errorf("no callback in handle map: %d", handle))
	}

	uniffiObj.OnMessage(
		FfiConverterEphemeralMessageINSTANCE.Lift(message),
	)

}

var UniffiVTableCallbackInterfaceEphemeralStreamCallbackINSTANCE = C.UniffiVTableCallbackInterfaceEphemeralStreamCallback{
	uniffiFree:  (C.UniffiCallbackInterfaceFree)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackFree),
	uniffiClone: (C.UniffiCallbackInterfaceClone)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackClone),
	onMessage:   (C.UniffiCallbackInterfaceEphemeralStreamCallbackMethod0)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackMethod0),
}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackFree
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackFree(handle C.uint64_t) {
	FfiConverterEphemeralStreamCallbackINSTANCE.handleMap.remove(uint64(handle))
}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackClone
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceEphemeralStreamCallbackClone(handle C.uint64_t) C.uint64_t {
	val, ok := FfiConverterEphemeralStreamCallbackINSTANCE.handleMap.tryGet(uint64(handle))
	if !ok {
		panic(fmt.Errorf("no callback in handle map: %d", handle))
	}
	return C.uint64_t(FfiConverterEphemeralStreamCallbackINSTANCE.handleMap.insert(val))
}

func (c FfiConverterEphemeralStreamCallback) register() {
	C.uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(&UniffiVTableCallbackInterfaceEphemeralStreamCallbackINSTANCE)
}

type EventInterface interface {
	Body() *[]byte
	Header() *Header
	IsCompleted() bool
	IsFailed() bool
}
type Event struct {
	ffiObject FfiObject
}

func (_self *Event) Body() *[]byte {
	_pointer := _self.ffiObject.incrementPointer("*Event")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterOptionalBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_event_body(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *Event) Header() *Header {
	_pointer := _self.ffiObject.incrementPointer("*Event")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterHeaderINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_event_header(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Event) IsCompleted() bool {
	_pointer := _self.ffiObject.incrementPointer("*Event")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBoolINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.int8_t {
		return C.uniffi_p2panda_ffi_fn_method_event_is_completed(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Event) IsFailed() bool {
	_pointer := _self.ffiObject.incrementPointer("*Event")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBoolINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.int8_t {
		return C.uniffi_p2panda_ffi_fn_method_event_is_failed(
			_pointer, _uniffiStatus)
	}))
}
func (object *Event) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterEvent struct{}

var FfiConverterEventINSTANCE = FfiConverterEvent{}

func (c FfiConverterEvent) Lift(handle C.uint64_t) *Event {
	result := &Event{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_event(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_event(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*Event).Destroy)
	return result
}

func (c FfiConverterEvent) Read(reader io.Reader) *Event {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterEvent) Lower(value *Event) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*Event")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterEvent) Write(writer io.Writer, value *Event) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalEvent(handle uint64) *Event {
	return FfiConverterEventINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalEvent(value *Event) uint64 {
	return uint64(FfiConverterEventINSTANCE.Lower(value))
}

type FfiDestroyerEvent struct{}

func (_ FfiDestroyerEvent) Destroy(value *Event) {
	value.Destroy()
}

type HashInterface interface {
	ToBytes() []byte
	ToHex() string
}
type Hash struct {
	ffiObject FfiObject
}

func HashDigest(value []byte) *Hash {
	return FfiConverterHashINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_hash_digest(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	}))
}

func HashFromBytes(value []byte) (*Hash, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *Hash
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterHashINSTANCE.Lift(_uniffiRV), nil
	}
}

func HashFromHex(value string) (*Hash, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_hash_from_hex(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *Hash
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterHashINSTANCE.Lift(_uniffiRV), nil
	}
}

func (_self *Hash) ToBytes() []byte {
	_pointer := _self.ffiObject.incrementPointer("*Hash")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_hash_to_bytes(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *Hash) ToHex() string {
	_pointer := _self.ffiObject.incrementPointer("*Hash")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_hash_to_hex(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *Hash) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterHash struct{}

var FfiConverterHashINSTANCE = FfiConverterHash{}

func (c FfiConverterHash) Lift(handle C.uint64_t) *Hash {
	result := &Hash{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_hash(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_hash(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*Hash).Destroy)
	return result
}

func (c FfiConverterHash) Read(reader io.Reader) *Hash {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterHash) Lower(value *Hash) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*Hash")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterHash) Write(writer io.Writer, value *Hash) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalHash(handle uint64) *Hash {
	return FfiConverterHashINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalHash(value *Hash) uint64 {
	return uint64(FfiConverterHashINSTANCE.Lower(value))
}

type FfiDestroyerHash struct{}

func (_ FfiDestroyerHash) Destroy(value *Hash) {
	value.Destroy()
}

type HeaderInterface interface {
	Backlink() **Hash
	Hash() *Hash
	LogId() *Hash
	PayloadHash() *Hash
	PayloadSize() uint64
	PruneFlag() bool
	PublicKey() *PublicKey
	SeqNum() uint64
	Signature() *Signature
	Timestamp() uint64
	Version() uint64
}
type Header struct {
	ffiObject FfiObject
}

func (_self *Header) Backlink() **Hash {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterOptionalHashINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_header_backlink(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *Header) Hash() *Hash {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterHashINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_hash(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) LogId() *Hash {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterHashINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_log_id(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) PayloadHash() *Hash {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterHashINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_payload_hash(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) PayloadSize() uint64 {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterUint64INSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_payload_size(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) PruneFlag() bool {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBoolINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.int8_t {
		return C.uniffi_p2panda_ffi_fn_method_header_prune_flag(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) PublicKey() *PublicKey {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterPublicKeyINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_public_key(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) SeqNum() uint64 {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterUint64INSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_seq_num(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) Signature() *Signature {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterSignatureINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_signature(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) Timestamp() uint64 {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterUint64INSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_timestamp(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Header) Version() uint64 {
	_pointer := _self.ffiObject.incrementPointer("*Header")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterUint64INSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_header_version(
			_pointer, _uniffiStatus)
	}))
}
func (object *Header) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterHeader struct{}

var FfiConverterHeaderINSTANCE = FfiConverterHeader{}

func (c FfiConverterHeader) Lift(handle C.uint64_t) *Header {
	result := &Header{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_header(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_header(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*Header).Destroy)
	return result
}

func (c FfiConverterHeader) Read(reader io.Reader) *Header {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterHeader) Lower(value *Header) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*Header")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterHeader) Write(writer io.Writer, value *Header) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalHeader(handle uint64) *Header {
	return FfiConverterHeaderINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalHeader(value *Header) uint64 {
	return uint64(FfiConverterHeaderINSTANCE.Lower(value))
}

type FfiDestroyerHeader struct{}

func (_ FfiDestroyerHeader) Destroy(value *Header) {
	value.Destroy()
}

type NetworkIdInterface interface {
	ToBytes() []byte
	ToHex() string
}
type NetworkId struct {
	ffiObject FfiObject
}

func NetworkIdFromBytes(value []byte) (*NetworkId, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *NetworkId
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterNetworkIdINSTANCE.Lift(_uniffiRV), nil
	}
}

func NetworkIdFromHash(hash *Hash) *NetworkId {
	return FfiConverterNetworkIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(FfiConverterHashINSTANCE.Lower(hash), _uniffiStatus)
	}))
}

func NetworkIdFromHex(value string) (*NetworkId, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *NetworkId
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterNetworkIdINSTANCE.Lift(_uniffiRV), nil
	}
}

func NetworkIdRandom() *NetworkId {
	return FfiConverterNetworkIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_networkid_random(_uniffiStatus)
	}))
}

func (_self *NetworkId) ToBytes() []byte {
	_pointer := _self.ffiObject.incrementPointer("*NetworkId")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_networkid_to_bytes(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *NetworkId) ToHex() string {
	_pointer := _self.ffiObject.incrementPointer("*NetworkId")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_networkid_to_hex(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *NetworkId) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterNetworkId struct{}

var FfiConverterNetworkIdINSTANCE = FfiConverterNetworkId{}

func (c FfiConverterNetworkId) Lift(handle C.uint64_t) *NetworkId {
	result := &NetworkId{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_networkid(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_networkid(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*NetworkId).Destroy)
	return result
}

func (c FfiConverterNetworkId) Read(reader io.Reader) *NetworkId {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterNetworkId) Lower(value *NetworkId) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*NetworkId")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterNetworkId) Write(writer io.Writer, value *NetworkId) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalNetworkId(handle uint64) *NetworkId {
	return FfiConverterNetworkIdINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalNetworkId(value *NetworkId) uint64 {
	return uint64(FfiConverterNetworkIdINSTANCE.Lower(value))
}

type FfiDestroyerNetworkId struct{}

func (_ FfiDestroyerNetworkId) Destroy(value *NetworkId) {
	value.Destroy()
}

type NodeInterface interface {
	EphemeralStream(topic *TopicId, onMessage EphemeralStreamCallback) (*EphemeralStream, error)
	Id() *PublicKey
	InsertBootstrap(nodeId *PublicKey, relayUrl *RelayUrl) error
	NetworkId() *NetworkId
	Stream(topic *TopicId, callback TopicStreamCallback) (*TopicStream, error)
	StreamFrom(topic *TopicId, from StreamFrom, callback TopicStreamCallback) (*TopicStream, error)
}
type Node struct {
	ffiObject FfiObject
}

func NodeSpawn() (*Node, error) {
	res, err := uniffiRustCallAsync[*SpawnError](
		FfiConverterSpawnErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *Node {
			return FfiConverterNodeINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_constructor_node_spawn(),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}

func (_self *Node) EphemeralStream(topic *TopicId, onMessage EphemeralStreamCallback) (*EphemeralStream, error) {
	_pointer := _self.ffiObject.incrementPointer("*Node")
	defer _self.ffiObject.decrementPointer()
	res, err := uniffiRustCallAsync[*CreateStreamError](
		FfiConverterCreateStreamErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *EphemeralStream {
			return FfiConverterEphemeralStreamINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_method_node_ephemeral_stream(
			_pointer, FfiConverterTopicIdINSTANCE.Lower(topic), FfiConverterEphemeralStreamCallbackINSTANCE.Lower(onMessage)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}

func (_self *Node) Id() *PublicKey {
	_pointer := _self.ffiObject.incrementPointer("*Node")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterPublicKeyINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_node_id(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Node) InsertBootstrap(nodeId *PublicKey, relayUrl *RelayUrl) error {
	_pointer := _self.ffiObject.incrementPointer("*Node")
	defer _self.ffiObject.decrementPointer()
	_, err := uniffiRustCallAsync[*NetworkError](
		FfiConverterNetworkErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) struct{} {
			C.ffi_p2panda_ffi_rust_future_complete_void(handle, status)
			return struct{}{}
		},
		// liftFn
		func(_ struct{}) struct{} { return struct{}{} },
		C.uniffi_p2panda_ffi_fn_method_node_insert_bootstrap(
			_pointer, FfiConverterPublicKeyINSTANCE.Lower(nodeId), FfiConverterRelayUrlINSTANCE.Lower(relayUrl)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_void(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_void(handle)
		},
	)

	if err == nil {
		return nil
	}

	return err
}

func (_self *Node) NetworkId() *NetworkId {
	_pointer := _self.ffiObject.incrementPointer("*Node")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterNetworkIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_node_network_id(
			_pointer, _uniffiStatus)
	}))
}

func (_self *Node) Stream(topic *TopicId, callback TopicStreamCallback) (*TopicStream, error) {
	_pointer := _self.ffiObject.incrementPointer("*Node")
	defer _self.ffiObject.decrementPointer()
	res, err := uniffiRustCallAsync[*CreateStreamError](
		FfiConverterCreateStreamErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *TopicStream {
			return FfiConverterTopicStreamINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_method_node_stream(
			_pointer, FfiConverterTopicIdINSTANCE.Lower(topic), FfiConverterTopicStreamCallbackINSTANCE.Lower(callback)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}

func (_self *Node) StreamFrom(topic *TopicId, from StreamFrom, callback TopicStreamCallback) (*TopicStream, error) {
	_pointer := _self.ffiObject.incrementPointer("*Node")
	defer _self.ffiObject.decrementPointer()
	res, err := uniffiRustCallAsync[*CreateStreamError](
		FfiConverterCreateStreamErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *TopicStream {
			return FfiConverterTopicStreamINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_method_node_stream_from(
			_pointer, FfiConverterTopicIdINSTANCE.Lower(topic), FfiConverterStreamFromINSTANCE.Lower(from), FfiConverterTopicStreamCallbackINSTANCE.Lower(callback)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}
func (object *Node) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterNode struct{}

var FfiConverterNodeINSTANCE = FfiConverterNode{}

func (c FfiConverterNode) Lift(handle C.uint64_t) *Node {
	result := &Node{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_node(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_node(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*Node).Destroy)
	return result
}

func (c FfiConverterNode) Read(reader io.Reader) *Node {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterNode) Lower(value *Node) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*Node")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterNode) Write(writer io.Writer, value *Node) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalNode(handle uint64) *Node {
	return FfiConverterNodeINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalNode(value *Node) uint64 {
	return uint64(FfiConverterNodeINSTANCE.Lower(value))
}

type FfiDestroyerNode struct{}

func (_ FfiDestroyerNode) Destroy(value *Node) {
	value.Destroy()
}

type NodeBuilderInterface interface {
	AckPolicy(ackPolicy AckPolicy) error
	BindIpV4(ipAddress string) error
	BindIpV6(ipAddress string) error
	BindPortV4(port uint16) error
	BindPortV6(port uint16) error
	Bootstrap(nodeId *PublicKey, relayUrl *RelayUrl) error
	DatabaseUrl(url string) error
	MdnsMode(mode MdnsDiscoveryMode) error
	NetworkId(networkId *NetworkId) error
	PrivateKey(privateKey *PrivateKey) error
	RelayUrl(url *RelayUrl) error
	Spawn() (*Node, error)
}
type NodeBuilder struct {
	ffiObject FfiObject
}

func NewNodeBuilder() *NodeBuilder {
	return FfiConverterNodeBuilderINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(_uniffiStatus)
	}))
}

func (_self *NodeBuilder) AckPolicy(ackPolicy AckPolicy) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy(
			_pointer, FfiConverterAckPolicyINSTANCE.Lower(ackPolicy), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) BindIpV4(ipAddress string) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4(
			_pointer, FfiConverterStringINSTANCE.Lower(ipAddress), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) BindIpV6(ipAddress string) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6(
			_pointer, FfiConverterStringINSTANCE.Lower(ipAddress), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) BindPortV4(port uint16) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4(
			_pointer, FfiConverterUint16INSTANCE.Lower(port), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) BindPortV6(port uint16) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6(
			_pointer, FfiConverterUint16INSTANCE.Lower(port), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) Bootstrap(nodeId *PublicKey, relayUrl *RelayUrl) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap(
			_pointer, FfiConverterPublicKeyINSTANCE.Lower(nodeId), FfiConverterRelayUrlINSTANCE.Lower(relayUrl), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) DatabaseUrl(url string) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_database_url(
			_pointer, FfiConverterStringINSTANCE.Lower(url), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) MdnsMode(mode MdnsDiscoveryMode) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode(
			_pointer, FfiConverterMdnsDiscoveryModeINSTANCE.Lower(mode), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) NetworkId(networkId *NetworkId) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_network_id(
			_pointer, FfiConverterNetworkIdINSTANCE.Lower(networkId), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) PrivateKey(privateKey *PrivateKey) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_private_key(
			_pointer, FfiConverterPrivateKeyINSTANCE.Lower(privateKey), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) RelayUrl(url *RelayUrl) error {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	_, _uniffiErr := rustCallWithError[*NodeBuilderError](FfiConverterNodeBuilderError{}, func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url(
			_pointer, FfiConverterRelayUrlINSTANCE.Lower(url), _uniffiStatus)
		return false
	})
	return _uniffiErr.AsError()
}

func (_self *NodeBuilder) Spawn() (*Node, error) {
	_pointer := _self.ffiObject.incrementPointer("*NodeBuilder")
	defer _self.ffiObject.decrementPointer()
	res, err := uniffiRustCallAsync[*SpawnError](
		FfiConverterSpawnErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *Node {
			return FfiConverterNodeINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_method_nodebuilder_spawn(
			_pointer),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}
func (object *NodeBuilder) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterNodeBuilder struct{}

var FfiConverterNodeBuilderINSTANCE = FfiConverterNodeBuilder{}

func (c FfiConverterNodeBuilder) Lift(handle C.uint64_t) *NodeBuilder {
	result := &NodeBuilder{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_nodebuilder(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_nodebuilder(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*NodeBuilder).Destroy)
	return result
}

func (c FfiConverterNodeBuilder) Read(reader io.Reader) *NodeBuilder {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterNodeBuilder) Lower(value *NodeBuilder) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*NodeBuilder")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterNodeBuilder) Write(writer io.Writer, value *NodeBuilder) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalNodeBuilder(handle uint64) *NodeBuilder {
	return FfiConverterNodeBuilderINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalNodeBuilder(value *NodeBuilder) uint64 {
	return uint64(FfiConverterNodeBuilderINSTANCE.Lower(value))
}

type FfiDestroyerNodeBuilder struct{}

func (_ FfiDestroyerNodeBuilder) Destroy(value *NodeBuilder) {
	value.Destroy()
}

type PrivateKeyInterface interface {
	PublicKey() *PublicKey
	Sign(bytes []byte) *Signature
	ToBytes() []byte
	ToHex() string
}
type PrivateKey struct {
	ffiObject FfiObject
}

func PrivateKeyFromBytes(value []byte) (*PrivateKey, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *PrivateKey
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterPrivateKeyINSTANCE.Lift(_uniffiRV), nil
	}
}

func PrivateKeyFromHex(value string) (*PrivateKey, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *PrivateKey
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterPrivateKeyINSTANCE.Lift(_uniffiRV), nil
	}
}

func PrivateKeyGenerate() *PrivateKey {
	return FfiConverterPrivateKeyINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_privatekey_generate(_uniffiStatus)
	}))
}

func (_self *PrivateKey) PublicKey() *PublicKey {
	_pointer := _self.ffiObject.incrementPointer("*PrivateKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterPublicKeyINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_privatekey_public_key(
			_pointer, _uniffiStatus)
	}))
}

func (_self *PrivateKey) Sign(bytes []byte) *Signature {
	_pointer := _self.ffiObject.incrementPointer("*PrivateKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterSignatureINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_privatekey_sign(
			_pointer, FfiConverterBytesINSTANCE.Lower(bytes), _uniffiStatus)
	}))
}

func (_self *PrivateKey) ToBytes() []byte {
	_pointer := _self.ffiObject.incrementPointer("*PrivateKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_privatekey_to_bytes(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *PrivateKey) ToHex() string {
	_pointer := _self.ffiObject.incrementPointer("*PrivateKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_privatekey_to_hex(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *PrivateKey) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterPrivateKey struct{}

var FfiConverterPrivateKeyINSTANCE = FfiConverterPrivateKey{}

func (c FfiConverterPrivateKey) Lift(handle C.uint64_t) *PrivateKey {
	result := &PrivateKey{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_privatekey(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_privatekey(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*PrivateKey).Destroy)
	return result
}

func (c FfiConverterPrivateKey) Read(reader io.Reader) *PrivateKey {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterPrivateKey) Lower(value *PrivateKey) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*PrivateKey")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterPrivateKey) Write(writer io.Writer, value *PrivateKey) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalPrivateKey(handle uint64) *PrivateKey {
	return FfiConverterPrivateKeyINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalPrivateKey(value *PrivateKey) uint64 {
	return uint64(FfiConverterPrivateKeyINSTANCE.Lower(value))
}

type FfiDestroyerPrivateKey struct{}

func (_ FfiDestroyerPrivateKey) Destroy(value *PrivateKey) {
	value.Destroy()
}

type ProcessedOperationInterface interface {
	Ack() error
	Author() *PublicKey
	Id() *Hash
	Message() []byte
	Processed() *Event
	Timestamp() uint64
	Topic() *TopicId
}
type ProcessedOperation struct {
	ffiObject FfiObject
}

func (_self *ProcessedOperation) Ack() error {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	_, err := uniffiRustCallAsync[*AckedError](
		FfiConverterAckedErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) struct{} {
			C.ffi_p2panda_ffi_rust_future_complete_void(handle, status)
			return struct{}{}
		},
		// liftFn
		func(_ struct{}) struct{} { return struct{}{} },
		C.uniffi_p2panda_ffi_fn_method_processedoperation_ack(
			_pointer),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_void(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_void(handle)
		},
	)

	if err == nil {
		return nil
	}

	return err
}

func (_self *ProcessedOperation) Author() *PublicKey {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterPublicKeyINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_processedoperation_author(
			_pointer, _uniffiStatus)
	}))
}

func (_self *ProcessedOperation) Id() *Hash {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterHashINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_processedoperation_id(
			_pointer, _uniffiStatus)
	}))
}

func (_self *ProcessedOperation) Message() []byte {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_processedoperation_message(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *ProcessedOperation) Processed() *Event {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterEventINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_processedoperation_processed(
			_pointer, _uniffiStatus)
	}))
}

func (_self *ProcessedOperation) Timestamp() uint64 {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterUint64INSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_processedoperation_timestamp(
			_pointer, _uniffiStatus)
	}))
}

func (_self *ProcessedOperation) Topic() *TopicId {
	_pointer := _self.ffiObject.incrementPointer("*ProcessedOperation")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterTopicIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_processedoperation_topic(
			_pointer, _uniffiStatus)
	}))
}
func (object *ProcessedOperation) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterProcessedOperation struct{}

var FfiConverterProcessedOperationINSTANCE = FfiConverterProcessedOperation{}

func (c FfiConverterProcessedOperation) Lift(handle C.uint64_t) *ProcessedOperation {
	result := &ProcessedOperation{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_processedoperation(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_processedoperation(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*ProcessedOperation).Destroy)
	return result
}

func (c FfiConverterProcessedOperation) Read(reader io.Reader) *ProcessedOperation {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterProcessedOperation) Lower(value *ProcessedOperation) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*ProcessedOperation")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterProcessedOperation) Write(writer io.Writer, value *ProcessedOperation) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalProcessedOperation(handle uint64) *ProcessedOperation {
	return FfiConverterProcessedOperationINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalProcessedOperation(value *ProcessedOperation) uint64 {
	return uint64(FfiConverterProcessedOperationINSTANCE.Lower(value))
}

type FfiDestroyerProcessedOperation struct{}

func (_ FfiDestroyerProcessedOperation) Destroy(value *ProcessedOperation) {
	value.Destroy()
}

type PublicKeyInterface interface {
	ToBytes() []byte
	ToHex() string
	Verify(bytes []byte, signature *Signature) bool
}
type PublicKey struct {
	ffiObject FfiObject
}

func PublicKeyFromBytes(value []byte) (*PublicKey, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *PublicKey
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterPublicKeyINSTANCE.Lift(_uniffiRV), nil
	}
}

func PublicKeyFromHex(value string) (*PublicKey, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *PublicKey
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterPublicKeyINSTANCE.Lift(_uniffiRV), nil
	}
}

func (_self *PublicKey) ToBytes() []byte {
	_pointer := _self.ffiObject.incrementPointer("*PublicKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_publickey_to_bytes(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *PublicKey) ToHex() string {
	_pointer := _self.ffiObject.incrementPointer("*PublicKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_publickey_to_hex(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *PublicKey) Verify(bytes []byte, signature *Signature) bool {
	_pointer := _self.ffiObject.incrementPointer("*PublicKey")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBoolINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.int8_t {
		return C.uniffi_p2panda_ffi_fn_method_publickey_verify(
			_pointer, FfiConverterBytesINSTANCE.Lower(bytes), FfiConverterSignatureINSTANCE.Lower(signature), _uniffiStatus)
	}))
}
func (object *PublicKey) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterPublicKey struct{}

var FfiConverterPublicKeyINSTANCE = FfiConverterPublicKey{}

func (c FfiConverterPublicKey) Lift(handle C.uint64_t) *PublicKey {
	result := &PublicKey{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_publickey(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_publickey(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*PublicKey).Destroy)
	return result
}

func (c FfiConverterPublicKey) Read(reader io.Reader) *PublicKey {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterPublicKey) Lower(value *PublicKey) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*PublicKey")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterPublicKey) Write(writer io.Writer, value *PublicKey) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalPublicKey(handle uint64) *PublicKey {
	return FfiConverterPublicKeyINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalPublicKey(value *PublicKey) uint64 {
	return uint64(FfiConverterPublicKeyINSTANCE.Lower(value))
}

type FfiDestroyerPublicKey struct{}

func (_ FfiDestroyerPublicKey) Destroy(value *PublicKey) {
	value.Destroy()
}

type RelayUrlInterface interface {
	ToStr() string
}
type RelayUrl struct {
	ffiObject FfiObject
}

func RelayUrlFromStr(value string) (*RelayUrl, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*RelayUrlParseError](FfiConverterRelayUrlParseError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *RelayUrl
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterRelayUrlINSTANCE.Lift(_uniffiRV), nil
	}
}

func (_self *RelayUrl) ToStr() string {
	_pointer := _self.ffiObject.incrementPointer("*RelayUrl")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_relayurl_to_str(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *RelayUrl) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterRelayUrl struct{}

var FfiConverterRelayUrlINSTANCE = FfiConverterRelayUrl{}

func (c FfiConverterRelayUrl) Lift(handle C.uint64_t) *RelayUrl {
	result := &RelayUrl{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_relayurl(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_relayurl(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*RelayUrl).Destroy)
	return result
}

func (c FfiConverterRelayUrl) Read(reader io.Reader) *RelayUrl {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterRelayUrl) Lower(value *RelayUrl) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*RelayUrl")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterRelayUrl) Write(writer io.Writer, value *RelayUrl) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalRelayUrl(handle uint64) *RelayUrl {
	return FfiConverterRelayUrlINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalRelayUrl(value *RelayUrl) uint64 {
	return uint64(FfiConverterRelayUrlINSTANCE.Lower(value))
}

type FfiDestroyerRelayUrl struct{}

func (_ FfiDestroyerRelayUrl) Destroy(value *RelayUrl) {
	value.Destroy()
}

type SignatureInterface interface {
	ToBytes() []byte
	ToHex() string
}
type Signature struct {
	ffiObject FfiObject
}

func SignatureFromBytes(value []byte) (*Signature, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *Signature
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterSignatureINSTANCE.Lift(_uniffiRV), nil
	}
}

func SignatureFromHex(value string) (*Signature, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_signature_from_hex(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *Signature
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterSignatureINSTANCE.Lift(_uniffiRV), nil
	}
}

func (_self *Signature) ToBytes() []byte {
	_pointer := _self.ffiObject.incrementPointer("*Signature")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_signature_to_bytes(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *Signature) ToHex() string {
	_pointer := _self.ffiObject.incrementPointer("*Signature")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_signature_to_hex(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *Signature) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterSignature struct{}

var FfiConverterSignatureINSTANCE = FfiConverterSignature{}

func (c FfiConverterSignature) Lift(handle C.uint64_t) *Signature {
	result := &Signature{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_signature(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_signature(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*Signature).Destroy)
	return result
}

func (c FfiConverterSignature) Read(reader io.Reader) *Signature {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterSignature) Lower(value *Signature) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*Signature")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterSignature) Write(writer io.Writer, value *Signature) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalSignature(handle uint64) *Signature {
	return FfiConverterSignatureINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalSignature(value *Signature) uint64 {
	return uint64(FfiConverterSignatureINSTANCE.Lower(value))
}

type FfiDestroyerSignature struct{}

func (_ FfiDestroyerSignature) Destroy(value *Signature) {
	value.Destroy()
}

type TopicIdInterface interface {
	ToBytes() []byte
	ToHex() string
}
type TopicId struct {
	ffiObject FfiObject
}

func TopicIdFromBytes(value []byte) (*TopicId, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(FfiConverterBytesINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *TopicId
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterTopicIdINSTANCE.Lift(_uniffiRV), nil
	}
}

func TopicIdFromHash(hash *Hash) *TopicId {
	return FfiConverterTopicIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(FfiConverterHashINSTANCE.Lower(hash), _uniffiStatus)
	}))
}

func TopicIdFromHex(value string) (*TopicId, error) {
	_uniffiRV, _uniffiErr := rustCallWithError[*ConversionError](FfiConverterConversionError{}, func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(FfiConverterStringINSTANCE.Lower(value), _uniffiStatus)
	})
	if _uniffiErr != nil {
		var _uniffiDefaultValue *TopicId
		return _uniffiDefaultValue, _uniffiErr
	} else {
		return FfiConverterTopicIdINSTANCE.Lift(_uniffiRV), nil
	}
}

func TopicIdRandom() *TopicId {
	return FfiConverterTopicIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_constructor_topicid_random(_uniffiStatus)
	}))
}

func (_self *TopicId) ToBytes() []byte {
	_pointer := _self.ffiObject.incrementPointer("*TopicId")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterBytesINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_topicid_to_bytes(
				_pointer, _uniffiStatus),
		}
	}))
}

func (_self *TopicId) ToHex() string {
	_pointer := _self.ffiObject.incrementPointer("*TopicId")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterStringINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) RustBufferI {
		return GoRustBuffer{
			inner: C.uniffi_p2panda_ffi_fn_method_topicid_to_hex(
				_pointer, _uniffiStatus),
		}
	}))
}
func (object *TopicId) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterTopicId struct{}

var FfiConverterTopicIdINSTANCE = FfiConverterTopicId{}

func (c FfiConverterTopicId) Lift(handle C.uint64_t) *TopicId {
	result := &TopicId{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_topicid(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_topicid(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*TopicId).Destroy)
	return result
}

func (c FfiConverterTopicId) Read(reader io.Reader) *TopicId {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterTopicId) Lower(value *TopicId) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*TopicId")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterTopicId) Write(writer io.Writer, value *TopicId) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalTopicId(handle uint64) *TopicId {
	return FfiConverterTopicIdINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalTopicId(value *TopicId) uint64 {
	return uint64(FfiConverterTopicIdINSTANCE.Lower(value))
}

type FfiDestroyerTopicId struct{}

func (_ FfiDestroyerTopicId) Destroy(value *TopicId) {
	value.Destroy()
}

type TopicStreamInterface interface {
	Ack(messageId *Hash) error
	Prune(message *[]byte) (*Hash, error)
	Publish(message []byte) (*Hash, error)
	Topic() *TopicId
}
type TopicStream struct {
	ffiObject FfiObject
}

func (_self *TopicStream) Ack(messageId *Hash) error {
	_pointer := _self.ffiObject.incrementPointer("*TopicStream")
	defer _self.ffiObject.decrementPointer()
	_, err := uniffiRustCallAsync[*AckedError](
		FfiConverterAckedErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) struct{} {
			C.ffi_p2panda_ffi_rust_future_complete_void(handle, status)
			return struct{}{}
		},
		// liftFn
		func(_ struct{}) struct{} { return struct{}{} },
		C.uniffi_p2panda_ffi_fn_method_topicstream_ack(
			_pointer, FfiConverterHashINSTANCE.Lower(messageId)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_void(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_void(handle)
		},
	)

	if err == nil {
		return nil
	}

	return err
}

func (_self *TopicStream) Prune(message *[]byte) (*Hash, error) {
	_pointer := _self.ffiObject.incrementPointer("*TopicStream")
	defer _self.ffiObject.decrementPointer()
	res, err := uniffiRustCallAsync[*PublishError](
		FfiConverterPublishErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *Hash {
			return FfiConverterHashINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_method_topicstream_prune(
			_pointer, FfiConverterOptionalBytesINSTANCE.Lower(message)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}

func (_self *TopicStream) Publish(message []byte) (*Hash, error) {
	_pointer := _self.ffiObject.incrementPointer("*TopicStream")
	defer _self.ffiObject.decrementPointer()
	res, err := uniffiRustCallAsync[*PublishError](
		FfiConverterPublishErrorINSTANCE,
		// completeFn
		func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
			res := C.ffi_p2panda_ffi_rust_future_complete_u64(handle, status)
			return res
		},
		// liftFn
		func(ffi C.uint64_t) *Hash {
			return FfiConverterHashINSTANCE.Lift(ffi)
		},
		C.uniffi_p2panda_ffi_fn_method_topicstream_publish(
			_pointer, FfiConverterBytesINSTANCE.Lower(message)),
		// pollFn
		func(handle C.uint64_t, continuation C.UniffiRustFutureContinuationCallback, data C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_poll_u64(handle, continuation, data)
		},
		// freeFn
		func(handle C.uint64_t) {
			C.ffi_p2panda_ffi_rust_future_free_u64(handle)
		},
	)

	if err == nil {
		return res, nil
	}

	return res, err
}

func (_self *TopicStream) Topic() *TopicId {
	_pointer := _self.ffiObject.incrementPointer("*TopicStream")
	defer _self.ffiObject.decrementPointer()
	return FfiConverterTopicIdINSTANCE.Lift(rustCall(func(_uniffiStatus *C.RustCallStatus) C.uint64_t {
		return C.uniffi_p2panda_ffi_fn_method_topicstream_topic(
			_pointer, _uniffiStatus)
	}))
}
func (object *TopicStream) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterTopicStream struct{}

var FfiConverterTopicStreamINSTANCE = FfiConverterTopicStream{}

func (c FfiConverterTopicStream) Lift(handle C.uint64_t) *TopicStream {
	result := &TopicStream{
		newFfiObject(
			handle,
			func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
				return C.uniffi_p2panda_ffi_fn_clone_topicstream(handle, status)
			},
			func(handle C.uint64_t, status *C.RustCallStatus) {
				C.uniffi_p2panda_ffi_fn_free_topicstream(handle, status)
			},
		),
	}
	runtime.SetFinalizer(result, (*TopicStream).Destroy)
	return result
}

func (c FfiConverterTopicStream) Read(reader io.Reader) *TopicStream {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterTopicStream) Lower(value *TopicStream) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	handle := value.ffiObject.incrementPointer("*TopicStream")
	defer value.ffiObject.decrementPointer()
	return handle
}

func (c FfiConverterTopicStream) Write(writer io.Writer, value *TopicStream) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalTopicStream(handle uint64) *TopicStream {
	return FfiConverterTopicStreamINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalTopicStream(value *TopicStream) uint64 {
	return uint64(FfiConverterTopicStreamINSTANCE.Lower(value))
}

type FfiDestroyerTopicStream struct{}

func (_ FfiDestroyerTopicStream) Destroy(value *TopicStream) {
	value.Destroy()
}

type TopicStreamCallback interface {
	OnEvent(event StreamEvent)
	OnError(error *StreamError)
	OnOperation(processed *ProcessedOperation, source Source)
}
type TopicStreamCallbackImpl struct {
	ffiObject FfiObject
}

func (_self *TopicStreamCallbackImpl) OnEvent(event StreamEvent) {
	_pointer := _self.ffiObject.incrementPointer("TopicStreamCallback")
	defer _self.ffiObject.decrementPointer()
	rustCall(func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event(
			_pointer, FfiConverterStreamEventINSTANCE.Lower(event), _uniffiStatus)
		return false
	})
}

func (_self *TopicStreamCallbackImpl) OnError(error *StreamError) {
	_pointer := _self.ffiObject.incrementPointer("TopicStreamCallback")
	defer _self.ffiObject.decrementPointer()
	rustCall(func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error(
			_pointer, FfiConverterStreamErrorINSTANCE.Lower(error), _uniffiStatus)
		return false
	})
}

func (_self *TopicStreamCallbackImpl) OnOperation(processed *ProcessedOperation, source Source) {
	_pointer := _self.ffiObject.incrementPointer("TopicStreamCallback")
	defer _self.ffiObject.decrementPointer()
	rustCall(func(_uniffiStatus *C.RustCallStatus) bool {
		C.uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation(
			_pointer, FfiConverterProcessedOperationINSTANCE.Lower(processed), FfiConverterSourceINSTANCE.Lower(source), _uniffiStatus)
		return false
	})
}
func (object *TopicStreamCallbackImpl) Destroy() {
	runtime.SetFinalizer(object, nil)
	object.ffiObject.destroy()
}

type FfiConverterTopicStreamCallback struct {
	handleMap *concurrentHandleMap[TopicStreamCallback]
}

var FfiConverterTopicStreamCallbackINSTANCE = FfiConverterTopicStreamCallback{
	handleMap: newConcurrentHandleMap[TopicStreamCallback](),
}

func (c FfiConverterTopicStreamCallback) Lift(handle C.uint64_t) TopicStreamCallback {
	if uint64(handle)&1 == 0 {
		// Rust-generated handle (even), construct a new object wrapping the handle
		result := &TopicStreamCallbackImpl{
			newFfiObject(
				handle,
				func(handle C.uint64_t, status *C.RustCallStatus) C.uint64_t {
					return C.uniffi_p2panda_ffi_fn_clone_topicstreamcallback(handle, status)
				},
				func(handle C.uint64_t, status *C.RustCallStatus) {
					C.uniffi_p2panda_ffi_fn_free_topicstreamcallback(handle, status)
				},
			),
		}
		runtime.SetFinalizer(result, (*TopicStreamCallbackImpl).Destroy)
		return result
	} else {
		// Go-generated handle (odd), retrieve from the handle map
		val, ok := c.handleMap.tryGet(uint64(handle))
		if !ok {
			panic(fmt.Errorf("no callback in handle map: %d", handle))
		}
		c.handleMap.remove(uint64(handle))
		return val
	}
}

func (c FfiConverterTopicStreamCallback) Read(reader io.Reader) TopicStreamCallback {
	return c.Lift(C.uint64_t(readUint64(reader)))
}

func (c FfiConverterTopicStreamCallback) Lower(value TopicStreamCallback) C.uint64_t {
	// TODO: this is bad - all synchronization from ObjectRuntime.go is discarded here,
	// because the handle will be decremented immediately after this function returns,
	// and someone will be left holding onto a non-locked handle.
	if val, ok := value.(*TopicStreamCallbackImpl); ok {
		// Rust-backed object, clone the handle
		handle := val.ffiObject.incrementPointer("TopicStreamCallback")
		defer val.ffiObject.decrementPointer()
		return handle
	} else {
		// Go-backed object, insert into handle map
		return C.uint64_t(c.handleMap.insert(value))
	}
}

func (c FfiConverterTopicStreamCallback) Write(writer io.Writer, value TopicStreamCallback) {
	writeUint64(writer, uint64(c.Lower(value)))
}

func LiftFromExternalTopicStreamCallback(handle uint64) TopicStreamCallback {
	return FfiConverterTopicStreamCallbackINSTANCE.Lift(C.uint64_t(handle))
}

func LowerToExternalTopicStreamCallback(value TopicStreamCallback) uint64 {
	return uint64(FfiConverterTopicStreamCallbackINSTANCE.Lower(value))
}

type FfiDestroyerTopicStreamCallback struct{}

func (_ FfiDestroyerTopicStreamCallback) Destroy(value TopicStreamCallback) {
	if val, ok := value.(*TopicStreamCallbackImpl); ok {
		val.Destroy()
	}
}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod0
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod0(uniffiHandle C.uint64_t, event C.RustBuffer, uniffiOutReturn *C.void, callStatus *C.RustCallStatus) {
	handle := uint64(uniffiHandle)
	uniffiObj, ok := FfiConverterTopicStreamCallbackINSTANCE.handleMap.tryGet(handle)
	if !ok {
		panic(fmt.Errorf("no callback in handle map: %d", handle))
	}

	uniffiObj.OnEvent(
		FfiConverterStreamEventINSTANCE.Lift(GoRustBuffer{
			inner: event,
		}),
	)

}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod1
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod1(uniffiHandle C.uint64_t, error C.RustBuffer, uniffiOutReturn *C.void, callStatus *C.RustCallStatus) {
	handle := uint64(uniffiHandle)
	uniffiObj, ok := FfiConverterTopicStreamCallbackINSTANCE.handleMap.tryGet(handle)
	if !ok {
		panic(fmt.Errorf("no callback in handle map: %d", handle))
	}

	uniffiObj.OnError(
		FfiConverterStreamErrorINSTANCE.Lift(GoRustBuffer{
			inner: error,
		}),
	)

}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod2
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod2(uniffiHandle C.uint64_t, processed C.uint64_t, source C.RustBuffer, uniffiOutReturn *C.void, callStatus *C.RustCallStatus) {
	handle := uint64(uniffiHandle)
	uniffiObj, ok := FfiConverterTopicStreamCallbackINSTANCE.handleMap.tryGet(handle)
	if !ok {
		panic(fmt.Errorf("no callback in handle map: %d", handle))
	}

	uniffiObj.OnOperation(
		FfiConverterProcessedOperationINSTANCE.Lift(processed),
		FfiConverterSourceINSTANCE.Lift(GoRustBuffer{
			inner: source,
		}),
	)

}

var UniffiVTableCallbackInterfaceTopicStreamCallbackINSTANCE = C.UniffiVTableCallbackInterfaceTopicStreamCallback{
	uniffiFree:  (C.UniffiCallbackInterfaceFree)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackFree),
	uniffiClone: (C.UniffiCallbackInterfaceClone)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackClone),
	onEvent:     (C.UniffiCallbackInterfaceTopicStreamCallbackMethod0)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod0),
	onError:     (C.UniffiCallbackInterfaceTopicStreamCallbackMethod1)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod1),
	onOperation: (C.UniffiCallbackInterfaceTopicStreamCallbackMethod2)(C.p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackMethod2),
}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackFree
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackFree(handle C.uint64_t) {
	FfiConverterTopicStreamCallbackINSTANCE.handleMap.remove(uint64(handle))
}

//export p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackClone
func p2panda_ffi_node_cgo_dispatchCallbackInterfaceTopicStreamCallbackClone(handle C.uint64_t) C.uint64_t {
	val, ok := FfiConverterTopicStreamCallbackINSTANCE.handleMap.tryGet(uint64(handle))
	if !ok {
		panic(fmt.Errorf("no callback in handle map: %d", handle))
	}
	return C.uint64_t(FfiConverterTopicStreamCallbackINSTANCE.handleMap.insert(val))
}

func (c FfiConverterTopicStreamCallback) register() {
	C.uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(&UniffiVTableCallbackInterfaceTopicStreamCallbackINSTANCE)
}

type AckPolicy uint

const (
	AckPolicyExplicit  AckPolicy = 1
	AckPolicyAutomatic AckPolicy = 2
)

type FfiConverterAckPolicy struct{}

var FfiConverterAckPolicyINSTANCE = FfiConverterAckPolicy{}

func (c FfiConverterAckPolicy) Lift(rb RustBufferI) AckPolicy {
	return LiftFromRustBuffer[AckPolicy](c, rb)
}

func (c FfiConverterAckPolicy) Lower(value AckPolicy) C.RustBuffer {
	return LowerIntoRustBuffer[AckPolicy](c, value)
}

func (c FfiConverterAckPolicy) LowerExternal(value AckPolicy) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[AckPolicy](c, value))
}
func (FfiConverterAckPolicy) Read(reader io.Reader) AckPolicy {
	id := readInt32(reader)
	return AckPolicy(id)
}

func (FfiConverterAckPolicy) Write(writer io.Writer, value AckPolicy) {
	writeInt32(writer, int32(value))
}

type FfiDestroyerAckPolicy struct{}

func (_ FfiDestroyerAckPolicy) Destroy(value AckPolicy) {
}

type AckedError struct {
	err error
}

// Convenience method to turn *AckedError into error
// Avoiding treating nil pointer as non nil error interface
func (err *AckedError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err AckedError) Error() string {
	return fmt.Sprintf("AckedError: %s", err.err.Error())
}

func (err AckedError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrAckedErrorAckedError = fmt.Errorf("AckedErrorAckedError")

// Variant structs
type AckedErrorAckedError struct {
	message string
}

func NewAckedErrorAckedError() *AckedError {
	return &AckedError{err: &AckedErrorAckedError{}}
}

func (e AckedErrorAckedError) destroy() {
}

func (err AckedErrorAckedError) Error() string {
	return fmt.Sprintf("AckedError: %s", err.message)
}

func (self AckedErrorAckedError) Is(target error) bool {
	return target == ErrAckedErrorAckedError
}

type FfiConverterAckedError struct{}

var FfiConverterAckedErrorINSTANCE = FfiConverterAckedError{}

func (c FfiConverterAckedError) Lift(eb RustBufferI) *AckedError {
	return LiftFromRustBuffer[*AckedError](c, eb)
}

func (c FfiConverterAckedError) Lower(value *AckedError) C.RustBuffer {
	return LowerIntoRustBuffer[*AckedError](c, value)
}

func (c FfiConverterAckedError) LowerExternal(value *AckedError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*AckedError](c, value))
}

func (c FfiConverterAckedError) Read(reader io.Reader) *AckedError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &AckedError{&AckedErrorAckedError{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterAckedError.Read()", errorID))
	}

}

func (c FfiConverterAckedError) Write(writer io.Writer, value *AckedError) {
	switch variantValue := value.err.(type) {
	case *AckedErrorAckedError:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterAckedError.Write", value))
	}
}

type FfiDestroyerAckedError struct{}

func (_ FfiDestroyerAckedError) Destroy(value *AckedError) {
	switch variantValue := value.err.(type) {
	case AckedErrorAckedError:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerAckedError.Destroy", value))
	}
}

type ConversionError struct {
	err error
}

// Convenience method to turn *ConversionError into error
// Avoiding treating nil pointer as non nil error interface
func (err *ConversionError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err ConversionError) Error() string {
	return fmt.Sprintf("ConversionError: %s", err.err.Error())
}

func (err ConversionError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrConversionErrorInvalidLength = fmt.Errorf("ConversionErrorInvalidLength")
var ErrConversionErrorInvalidHexEncoding = fmt.Errorf("ConversionErrorInvalidHexEncoding")

// Variant structs
// Invalid number of bytes.
type ConversionErrorInvalidLength struct {
	message string
}

// Invalid number of bytes.
func NewConversionErrorInvalidLength() *ConversionError {
	return &ConversionError{err: &ConversionErrorInvalidLength{}}
}

func (e ConversionErrorInvalidLength) destroy() {
}

func (err ConversionErrorInvalidLength) Error() string {
	return fmt.Sprintf("InvalidLength: %s", err.message)
}

func (self ConversionErrorInvalidLength) Is(target error) bool {
	return target == ErrConversionErrorInvalidLength
}

// String contains invalid hexadecimal characters.
type ConversionErrorInvalidHexEncoding struct {
	message string
}

// String contains invalid hexadecimal characters.
func NewConversionErrorInvalidHexEncoding() *ConversionError {
	return &ConversionError{err: &ConversionErrorInvalidHexEncoding{}}
}

func (e ConversionErrorInvalidHexEncoding) destroy() {
}

func (err ConversionErrorInvalidHexEncoding) Error() string {
	return fmt.Sprintf("InvalidHexEncoding: %s", err.message)
}

func (self ConversionErrorInvalidHexEncoding) Is(target error) bool {
	return target == ErrConversionErrorInvalidHexEncoding
}

type FfiConverterConversionError struct{}

var FfiConverterConversionErrorINSTANCE = FfiConverterConversionError{}

func (c FfiConverterConversionError) Lift(eb RustBufferI) *ConversionError {
	return LiftFromRustBuffer[*ConversionError](c, eb)
}

func (c FfiConverterConversionError) Lower(value *ConversionError) C.RustBuffer {
	return LowerIntoRustBuffer[*ConversionError](c, value)
}

func (c FfiConverterConversionError) LowerExternal(value *ConversionError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*ConversionError](c, value))
}

func (c FfiConverterConversionError) Read(reader io.Reader) *ConversionError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &ConversionError{&ConversionErrorInvalidLength{message}}
	case 2:
		return &ConversionError{&ConversionErrorInvalidHexEncoding{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterConversionError.Read()", errorID))
	}

}

func (c FfiConverterConversionError) Write(writer io.Writer, value *ConversionError) {
	switch variantValue := value.err.(type) {
	case *ConversionErrorInvalidLength:
		writeInt32(writer, 1)
	case *ConversionErrorInvalidHexEncoding:
		writeInt32(writer, 2)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterConversionError.Write", value))
	}
}

type FfiDestroyerConversionError struct{}

func (_ FfiDestroyerConversionError) Destroy(value *ConversionError) {
	switch variantValue := value.err.(type) {
	case ConversionErrorInvalidLength:
		variantValue.destroy()
	case ConversionErrorInvalidHexEncoding:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerConversionError.Destroy", value))
	}
}

type CreateStreamError struct {
	err error
}

// Convenience method to turn *CreateStreamError into error
// Avoiding treating nil pointer as non nil error interface
func (err *CreateStreamError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err CreateStreamError) Error() string {
	return fmt.Sprintf("CreateStreamError: %s", err.err.Error())
}

func (err CreateStreamError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrCreateStreamErrorCreateStream = fmt.Errorf("CreateStreamErrorCreateStream")

// Variant structs
type CreateStreamErrorCreateStream struct {
	message string
}

func NewCreateStreamErrorCreateStream() *CreateStreamError {
	return &CreateStreamError{err: &CreateStreamErrorCreateStream{}}
}

func (e CreateStreamErrorCreateStream) destroy() {
}

func (err CreateStreamErrorCreateStream) Error() string {
	return fmt.Sprintf("CreateStream: %s", err.message)
}

func (self CreateStreamErrorCreateStream) Is(target error) bool {
	return target == ErrCreateStreamErrorCreateStream
}

type FfiConverterCreateStreamError struct{}

var FfiConverterCreateStreamErrorINSTANCE = FfiConverterCreateStreamError{}

func (c FfiConverterCreateStreamError) Lift(eb RustBufferI) *CreateStreamError {
	return LiftFromRustBuffer[*CreateStreamError](c, eb)
}

func (c FfiConverterCreateStreamError) Lower(value *CreateStreamError) C.RustBuffer {
	return LowerIntoRustBuffer[*CreateStreamError](c, value)
}

func (c FfiConverterCreateStreamError) LowerExternal(value *CreateStreamError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*CreateStreamError](c, value))
}

func (c FfiConverterCreateStreamError) Read(reader io.Reader) *CreateStreamError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &CreateStreamError{&CreateStreamErrorCreateStream{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterCreateStreamError.Read()", errorID))
	}

}

func (c FfiConverterCreateStreamError) Write(writer io.Writer, value *CreateStreamError) {
	switch variantValue := value.err.(type) {
	case *CreateStreamErrorCreateStream:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterCreateStreamError.Write", value))
	}
}

type FfiDestroyerCreateStreamError struct{}

func (_ FfiDestroyerCreateStreamError) Destroy(value *CreateStreamError) {
	switch variantValue := value.err.(type) {
	case CreateStreamErrorCreateStream:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerCreateStreamError.Destroy", value))
	}
}

type EphemeralPublishError struct {
	err error
}

// Convenience method to turn *EphemeralPublishError into error
// Avoiding treating nil pointer as non nil error interface
func (err *EphemeralPublishError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err EphemeralPublishError) Error() string {
	return fmt.Sprintf("EphemeralPublishError: %s", err.err.Error())
}

func (err EphemeralPublishError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrEphemeralPublishErrorEphemeralPublish = fmt.Errorf("EphemeralPublishErrorEphemeralPublish")

// Variant structs
type EphemeralPublishErrorEphemeralPublish struct {
	message string
}

func NewEphemeralPublishErrorEphemeralPublish() *EphemeralPublishError {
	return &EphemeralPublishError{err: &EphemeralPublishErrorEphemeralPublish{}}
}

func (e EphemeralPublishErrorEphemeralPublish) destroy() {
}

func (err EphemeralPublishErrorEphemeralPublish) Error() string {
	return fmt.Sprintf("EphemeralPublish: %s", err.message)
}

func (self EphemeralPublishErrorEphemeralPublish) Is(target error) bool {
	return target == ErrEphemeralPublishErrorEphemeralPublish
}

type FfiConverterEphemeralPublishError struct{}

var FfiConverterEphemeralPublishErrorINSTANCE = FfiConverterEphemeralPublishError{}

func (c FfiConverterEphemeralPublishError) Lift(eb RustBufferI) *EphemeralPublishError {
	return LiftFromRustBuffer[*EphemeralPublishError](c, eb)
}

func (c FfiConverterEphemeralPublishError) Lower(value *EphemeralPublishError) C.RustBuffer {
	return LowerIntoRustBuffer[*EphemeralPublishError](c, value)
}

func (c FfiConverterEphemeralPublishError) LowerExternal(value *EphemeralPublishError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*EphemeralPublishError](c, value))
}

func (c FfiConverterEphemeralPublishError) Read(reader io.Reader) *EphemeralPublishError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &EphemeralPublishError{&EphemeralPublishErrorEphemeralPublish{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterEphemeralPublishError.Read()", errorID))
	}

}

func (c FfiConverterEphemeralPublishError) Write(writer io.Writer, value *EphemeralPublishError) {
	switch variantValue := value.err.(type) {
	case *EphemeralPublishErrorEphemeralPublish:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterEphemeralPublishError.Write", value))
	}
}

type FfiDestroyerEphemeralPublishError struct{}

func (_ FfiDestroyerEphemeralPublishError) Destroy(value *EphemeralPublishError) {
	switch variantValue := value.err.(type) {
	case EphemeralPublishErrorEphemeralPublish:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerEphemeralPublishError.Destroy", value))
	}
}

type IpAddrError struct {
	err error
}

// Convenience method to turn *IpAddrError into error
// Avoiding treating nil pointer as non nil error interface
func (err *IpAddrError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err IpAddrError) Error() string {
	return fmt.Sprintf("IpAddrError: %s", err.err.Error())
}

func (err IpAddrError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrIpAddrErrorParseInvalidAddr = fmt.Errorf("IpAddrErrorParseInvalidAddr")

// Variant structs
type IpAddrErrorParseInvalidAddr struct {
	message string
}

func NewIpAddrErrorParseInvalidAddr() *IpAddrError {
	return &IpAddrError{err: &IpAddrErrorParseInvalidAddr{}}
}

func (e IpAddrErrorParseInvalidAddr) destroy() {
}

func (err IpAddrErrorParseInvalidAddr) Error() string {
	return fmt.Sprintf("ParseInvalidAddr: %s", err.message)
}

func (self IpAddrErrorParseInvalidAddr) Is(target error) bool {
	return target == ErrIpAddrErrorParseInvalidAddr
}

type FfiConverterIpAddrError struct{}

var FfiConverterIpAddrErrorINSTANCE = FfiConverterIpAddrError{}

func (c FfiConverterIpAddrError) Lift(eb RustBufferI) *IpAddrError {
	return LiftFromRustBuffer[*IpAddrError](c, eb)
}

func (c FfiConverterIpAddrError) Lower(value *IpAddrError) C.RustBuffer {
	return LowerIntoRustBuffer[*IpAddrError](c, value)
}

func (c FfiConverterIpAddrError) LowerExternal(value *IpAddrError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*IpAddrError](c, value))
}

func (c FfiConverterIpAddrError) Read(reader io.Reader) *IpAddrError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &IpAddrError{&IpAddrErrorParseInvalidAddr{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterIpAddrError.Read()", errorID))
	}

}

func (c FfiConverterIpAddrError) Write(writer io.Writer, value *IpAddrError) {
	switch variantValue := value.err.(type) {
	case *IpAddrErrorParseInvalidAddr:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterIpAddrError.Write", value))
	}
}

type FfiDestroyerIpAddrError struct{}

func (_ FfiDestroyerIpAddrError) Destroy(value *IpAddrError) {
	switch variantValue := value.err.(type) {
	case IpAddrErrorParseInvalidAddr:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerIpAddrError.Destroy", value))
	}
}

type MdnsDiscoveryMode uint

const (
	MdnsDiscoveryModeDisabled MdnsDiscoveryMode = 1
	MdnsDiscoveryModePassive  MdnsDiscoveryMode = 2
	MdnsDiscoveryModeActive   MdnsDiscoveryMode = 3
)

type FfiConverterMdnsDiscoveryMode struct{}

var FfiConverterMdnsDiscoveryModeINSTANCE = FfiConverterMdnsDiscoveryMode{}

func (c FfiConverterMdnsDiscoveryMode) Lift(rb RustBufferI) MdnsDiscoveryMode {
	return LiftFromRustBuffer[MdnsDiscoveryMode](c, rb)
}

func (c FfiConverterMdnsDiscoveryMode) Lower(value MdnsDiscoveryMode) C.RustBuffer {
	return LowerIntoRustBuffer[MdnsDiscoveryMode](c, value)
}

func (c FfiConverterMdnsDiscoveryMode) LowerExternal(value MdnsDiscoveryMode) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[MdnsDiscoveryMode](c, value))
}
func (FfiConverterMdnsDiscoveryMode) Read(reader io.Reader) MdnsDiscoveryMode {
	id := readInt32(reader)
	return MdnsDiscoveryMode(id)
}

func (FfiConverterMdnsDiscoveryMode) Write(writer io.Writer, value MdnsDiscoveryMode) {
	writeInt32(writer, int32(value))
}

type FfiDestroyerMdnsDiscoveryMode struct{}

func (_ FfiDestroyerMdnsDiscoveryMode) Destroy(value MdnsDiscoveryMode) {
}

type NetworkError struct {
	err error
}

// Convenience method to turn *NetworkError into error
// Avoiding treating nil pointer as non nil error interface
func (err *NetworkError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err NetworkError) Error() string {
	return fmt.Sprintf("NetworkError: %s", err.err.Error())
}

func (err NetworkError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrNetworkErrorNetwork = fmt.Errorf("NetworkErrorNetwork")

// Variant structs
type NetworkErrorNetwork struct {
	message string
}

func NewNetworkErrorNetwork() *NetworkError {
	return &NetworkError{err: &NetworkErrorNetwork{}}
}

func (e NetworkErrorNetwork) destroy() {
}

func (err NetworkErrorNetwork) Error() string {
	return fmt.Sprintf("Network: %s", err.message)
}

func (self NetworkErrorNetwork) Is(target error) bool {
	return target == ErrNetworkErrorNetwork
}

type FfiConverterNetworkError struct{}

var FfiConverterNetworkErrorINSTANCE = FfiConverterNetworkError{}

func (c FfiConverterNetworkError) Lift(eb RustBufferI) *NetworkError {
	return LiftFromRustBuffer[*NetworkError](c, eb)
}

func (c FfiConverterNetworkError) Lower(value *NetworkError) C.RustBuffer {
	return LowerIntoRustBuffer[*NetworkError](c, value)
}

func (c FfiConverterNetworkError) LowerExternal(value *NetworkError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*NetworkError](c, value))
}

func (c FfiConverterNetworkError) Read(reader io.Reader) *NetworkError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &NetworkError{&NetworkErrorNetwork{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterNetworkError.Read()", errorID))
	}

}

func (c FfiConverterNetworkError) Write(writer io.Writer, value *NetworkError) {
	switch variantValue := value.err.(type) {
	case *NetworkErrorNetwork:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterNetworkError.Write", value))
	}
}

type FfiDestroyerNetworkError struct{}

func (_ FfiDestroyerNetworkError) Destroy(value *NetworkError) {
	switch variantValue := value.err.(type) {
	case NetworkErrorNetwork:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerNetworkError.Destroy", value))
	}
}

type NodeBuilderError struct {
	err error
}

// Convenience method to turn *NodeBuilderError into error
// Avoiding treating nil pointer as non nil error interface
func (err *NodeBuilderError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err NodeBuilderError) Error() string {
	return fmt.Sprintf("NodeBuilderError: %s", err.err.Error())
}

func (err NodeBuilderError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrNodeBuilderErrorAlreadyConsumed = fmt.Errorf("NodeBuilderErrorAlreadyConsumed")
var ErrNodeBuilderErrorMutexPoisoned = fmt.Errorf("NodeBuilderErrorMutexPoisoned")
var ErrNodeBuilderErrorIpAddr = fmt.Errorf("NodeBuilderErrorIpAddr")

// Variant structs
type NodeBuilderErrorAlreadyConsumed struct {
	message string
}

func NewNodeBuilderErrorAlreadyConsumed() *NodeBuilderError {
	return &NodeBuilderError{err: &NodeBuilderErrorAlreadyConsumed{}}
}

func (e NodeBuilderErrorAlreadyConsumed) destroy() {
}

func (err NodeBuilderErrorAlreadyConsumed) Error() string {
	return fmt.Sprintf("AlreadyConsumed: %s", err.message)
}

func (self NodeBuilderErrorAlreadyConsumed) Is(target error) bool {
	return target == ErrNodeBuilderErrorAlreadyConsumed
}

type NodeBuilderErrorMutexPoisoned struct {
	message string
}

func NewNodeBuilderErrorMutexPoisoned() *NodeBuilderError {
	return &NodeBuilderError{err: &NodeBuilderErrorMutexPoisoned{}}
}

func (e NodeBuilderErrorMutexPoisoned) destroy() {
}

func (err NodeBuilderErrorMutexPoisoned) Error() string {
	return fmt.Sprintf("MutexPoisoned: %s", err.message)
}

func (self NodeBuilderErrorMutexPoisoned) Is(target error) bool {
	return target == ErrNodeBuilderErrorMutexPoisoned
}

type NodeBuilderErrorIpAddr struct {
	message string
}

func NewNodeBuilderErrorIpAddr() *NodeBuilderError {
	return &NodeBuilderError{err: &NodeBuilderErrorIpAddr{}}
}

func (e NodeBuilderErrorIpAddr) destroy() {
}

func (err NodeBuilderErrorIpAddr) Error() string {
	return fmt.Sprintf("IpAddr: %s", err.message)
}

func (self NodeBuilderErrorIpAddr) Is(target error) bool {
	return target == ErrNodeBuilderErrorIpAddr
}

type FfiConverterNodeBuilderError struct{}

var FfiConverterNodeBuilderErrorINSTANCE = FfiConverterNodeBuilderError{}

func (c FfiConverterNodeBuilderError) Lift(eb RustBufferI) *NodeBuilderError {
	return LiftFromRustBuffer[*NodeBuilderError](c, eb)
}

func (c FfiConverterNodeBuilderError) Lower(value *NodeBuilderError) C.RustBuffer {
	return LowerIntoRustBuffer[*NodeBuilderError](c, value)
}

func (c FfiConverterNodeBuilderError) LowerExternal(value *NodeBuilderError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*NodeBuilderError](c, value))
}

func (c FfiConverterNodeBuilderError) Read(reader io.Reader) *NodeBuilderError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &NodeBuilderError{&NodeBuilderErrorAlreadyConsumed{message}}
	case 2:
		return &NodeBuilderError{&NodeBuilderErrorMutexPoisoned{message}}
	case 3:
		return &NodeBuilderError{&NodeBuilderErrorIpAddr{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterNodeBuilderError.Read()", errorID))
	}

}

func (c FfiConverterNodeBuilderError) Write(writer io.Writer, value *NodeBuilderError) {
	switch variantValue := value.err.(type) {
	case *NodeBuilderErrorAlreadyConsumed:
		writeInt32(writer, 1)
	case *NodeBuilderErrorMutexPoisoned:
		writeInt32(writer, 2)
	case *NodeBuilderErrorIpAddr:
		writeInt32(writer, 3)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterNodeBuilderError.Write", value))
	}
}

type FfiDestroyerNodeBuilderError struct{}

func (_ FfiDestroyerNodeBuilderError) Destroy(value *NodeBuilderError) {
	switch variantValue := value.err.(type) {
	case NodeBuilderErrorAlreadyConsumed:
		variantValue.destroy()
	case NodeBuilderErrorMutexPoisoned:
		variantValue.destroy()
	case NodeBuilderErrorIpAddr:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerNodeBuilderError.Destroy", value))
	}
}

type PublishError struct {
	err error
}

// Convenience method to turn *PublishError into error
// Avoiding treating nil pointer as non nil error interface
func (err *PublishError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err PublishError) Error() string {
	return fmt.Sprintf("PublishError: %s", err.err.Error())
}

func (err PublishError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrPublishErrorPublishError = fmt.Errorf("PublishErrorPublishError")

// Variant structs
type PublishErrorPublishError struct {
	message string
}

func NewPublishErrorPublishError() *PublishError {
	return &PublishError{err: &PublishErrorPublishError{}}
}

func (e PublishErrorPublishError) destroy() {
}

func (err PublishErrorPublishError) Error() string {
	return fmt.Sprintf("PublishError: %s", err.message)
}

func (self PublishErrorPublishError) Is(target error) bool {
	return target == ErrPublishErrorPublishError
}

type FfiConverterPublishError struct{}

var FfiConverterPublishErrorINSTANCE = FfiConverterPublishError{}

func (c FfiConverterPublishError) Lift(eb RustBufferI) *PublishError {
	return LiftFromRustBuffer[*PublishError](c, eb)
}

func (c FfiConverterPublishError) Lower(value *PublishError) C.RustBuffer {
	return LowerIntoRustBuffer[*PublishError](c, value)
}

func (c FfiConverterPublishError) LowerExternal(value *PublishError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*PublishError](c, value))
}

func (c FfiConverterPublishError) Read(reader io.Reader) *PublishError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &PublishError{&PublishErrorPublishError{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterPublishError.Read()", errorID))
	}

}

func (c FfiConverterPublishError) Write(writer io.Writer, value *PublishError) {
	switch variantValue := value.err.(type) {
	case *PublishErrorPublishError:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterPublishError.Write", value))
	}
}

type FfiDestroyerPublishError struct{}

func (_ FfiDestroyerPublishError) Destroy(value *PublishError) {
	switch variantValue := value.err.(type) {
	case PublishErrorPublishError:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerPublishError.Destroy", value))
	}
}

type RelayUrlParseError struct {
	err error
}

// Convenience method to turn *RelayUrlParseError into error
// Avoiding treating nil pointer as non nil error interface
func (err *RelayUrlParseError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err RelayUrlParseError) Error() string {
	return fmt.Sprintf("RelayUrlParseError: %s", err.err.Error())
}

func (err RelayUrlParseError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrRelayUrlParseErrorInvalid = fmt.Errorf("RelayUrlParseErrorInvalid")

// Variant structs
type RelayUrlParseErrorInvalid struct {
	message string
}

func NewRelayUrlParseErrorInvalid() *RelayUrlParseError {
	return &RelayUrlParseError{err: &RelayUrlParseErrorInvalid{}}
}

func (e RelayUrlParseErrorInvalid) destroy() {
}

func (err RelayUrlParseErrorInvalid) Error() string {
	return fmt.Sprintf("Invalid: %s", err.message)
}

func (self RelayUrlParseErrorInvalid) Is(target error) bool {
	return target == ErrRelayUrlParseErrorInvalid
}

type FfiConverterRelayUrlParseError struct{}

var FfiConverterRelayUrlParseErrorINSTANCE = FfiConverterRelayUrlParseError{}

func (c FfiConverterRelayUrlParseError) Lift(eb RustBufferI) *RelayUrlParseError {
	return LiftFromRustBuffer[*RelayUrlParseError](c, eb)
}

func (c FfiConverterRelayUrlParseError) Lower(value *RelayUrlParseError) C.RustBuffer {
	return LowerIntoRustBuffer[*RelayUrlParseError](c, value)
}

func (c FfiConverterRelayUrlParseError) LowerExternal(value *RelayUrlParseError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*RelayUrlParseError](c, value))
}

func (c FfiConverterRelayUrlParseError) Read(reader io.Reader) *RelayUrlParseError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &RelayUrlParseError{&RelayUrlParseErrorInvalid{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterRelayUrlParseError.Read()", errorID))
	}

}

func (c FfiConverterRelayUrlParseError) Write(writer io.Writer, value *RelayUrlParseError) {
	switch variantValue := value.err.(type) {
	case *RelayUrlParseErrorInvalid:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterRelayUrlParseError.Write", value))
	}
}

type FfiDestroyerRelayUrlParseError struct{}

func (_ FfiDestroyerRelayUrlParseError) Destroy(value *RelayUrlParseError) {
	switch variantValue := value.err.(type) {
	case RelayUrlParseErrorInvalid:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerRelayUrlParseError.Destroy", value))
	}
}

type SessionPhase uint

const (
	SessionPhaseSync SessionPhase = 1
	SessionPhaseLive SessionPhase = 2
)

type FfiConverterSessionPhase struct{}

var FfiConverterSessionPhaseINSTANCE = FfiConverterSessionPhase{}

func (c FfiConverterSessionPhase) Lift(rb RustBufferI) SessionPhase {
	return LiftFromRustBuffer[SessionPhase](c, rb)
}

func (c FfiConverterSessionPhase) Lower(value SessionPhase) C.RustBuffer {
	return LowerIntoRustBuffer[SessionPhase](c, value)
}

func (c FfiConverterSessionPhase) LowerExternal(value SessionPhase) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[SessionPhase](c, value))
}
func (FfiConverterSessionPhase) Read(reader io.Reader) SessionPhase {
	id := readInt32(reader)
	return SessionPhase(id)
}

func (FfiConverterSessionPhase) Write(writer io.Writer, value SessionPhase) {
	writeInt32(writer, int32(value))
}

type FfiDestroyerSessionPhase struct{}

func (_ FfiDestroyerSessionPhase) Destroy(value SessionPhase) {
}

type Source interface {
	Destroy()
}
type SourceSyncSession struct {
	RemoteNodeId            *PublicKey
	SessionId               uint64
	SentOperations          uint64
	ReceivedOperations      uint64
	SentBytes               uint64
	ReceivedBytes           uint64
	SentBytesTopicTotal     uint64
	ReceivedBytesTopicTotal uint64
	Phase                   SessionPhase
}

func (e SourceSyncSession) Destroy() {
	FfiDestroyerPublicKey{}.Destroy(e.RemoteNodeId)
	FfiDestroyerUint64{}.Destroy(e.SessionId)
	FfiDestroyerUint64{}.Destroy(e.SentOperations)
	FfiDestroyerUint64{}.Destroy(e.ReceivedOperations)
	FfiDestroyerUint64{}.Destroy(e.SentBytes)
	FfiDestroyerUint64{}.Destroy(e.ReceivedBytes)
	FfiDestroyerUint64{}.Destroy(e.SentBytesTopicTotal)
	FfiDestroyerUint64{}.Destroy(e.ReceivedBytesTopicTotal)
	FfiDestroyerSessionPhase{}.Destroy(e.Phase)
}

type SourceLocalStore struct {
}

func (e SourceLocalStore) Destroy() {
}

type FfiConverterSource struct{}

var FfiConverterSourceINSTANCE = FfiConverterSource{}

func (c FfiConverterSource) Lift(rb RustBufferI) Source {
	return LiftFromRustBuffer[Source](c, rb)
}

func (c FfiConverterSource) Lower(value Source) C.RustBuffer {
	return LowerIntoRustBuffer[Source](c, value)
}

func (c FfiConverterSource) LowerExternal(value Source) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[Source](c, value))
}
func (FfiConverterSource) Read(reader io.Reader) Source {
	id := readInt32(reader)
	switch id {
	case 1:
		return SourceSyncSession{
			FfiConverterPublicKeyINSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterSessionPhaseINSTANCE.Read(reader),
		}
	case 2:
		return SourceLocalStore{}
	default:
		panic(fmt.Sprintf("invalid enum value %v in FfiConverterSource.Read()", id))
	}
}

func (FfiConverterSource) Write(writer io.Writer, value Source) {
	switch variant_value := value.(type) {
	case SourceSyncSession:
		writeInt32(writer, 1)
		FfiConverterPublicKeyINSTANCE.Write(writer, variant_value.RemoteNodeId)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SessionId)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SentOperations)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.ReceivedOperations)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SentBytes)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.ReceivedBytes)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SentBytesTopicTotal)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.ReceivedBytesTopicTotal)
		FfiConverterSessionPhaseINSTANCE.Write(writer, variant_value.Phase)
	case SourceLocalStore:
		writeInt32(writer, 2)
	default:
		_ = variant_value
		panic(fmt.Sprintf("invalid enum value `%v` in FfiConverterSource.Write", value))
	}
}

type FfiDestroyerSource struct{}

func (_ FfiDestroyerSource) Destroy(value Source) {
	value.Destroy()
}

type SpawnError struct {
	err error
}

// Convenience method to turn *SpawnError into error
// Avoiding treating nil pointer as non nil error interface
func (err *SpawnError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err SpawnError) Error() string {
	return fmt.Sprintf("SpawnError: %s", err.err.Error())
}

func (err SpawnError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrSpawnErrorSpawn = fmt.Errorf("SpawnErrorSpawn")
var ErrSpawnErrorNodeBuilder = fmt.Errorf("SpawnErrorNodeBuilder")
var ErrSpawnErrorRpc = fmt.Errorf("SpawnErrorRpc")

// Variant structs
type SpawnErrorSpawn struct {
	message string
}

func NewSpawnErrorSpawn() *SpawnError {
	return &SpawnError{err: &SpawnErrorSpawn{}}
}

func (e SpawnErrorSpawn) destroy() {
}

func (err SpawnErrorSpawn) Error() string {
	return fmt.Sprintf("Spawn: %s", err.message)
}

func (self SpawnErrorSpawn) Is(target error) bool {
	return target == ErrSpawnErrorSpawn
}

type SpawnErrorNodeBuilder struct {
	message string
}

func NewSpawnErrorNodeBuilder() *SpawnError {
	return &SpawnError{err: &SpawnErrorNodeBuilder{}}
}

func (e SpawnErrorNodeBuilder) destroy() {
}

func (err SpawnErrorNodeBuilder) Error() string {
	return fmt.Sprintf("NodeBuilder: %s", err.message)
}

func (self SpawnErrorNodeBuilder) Is(target error) bool {
	return target == ErrSpawnErrorNodeBuilder
}

type SpawnErrorRpc struct {
	message string
}

func NewSpawnErrorRpc() *SpawnError {
	return &SpawnError{err: &SpawnErrorRpc{}}
}

func (e SpawnErrorRpc) destroy() {
}

func (err SpawnErrorRpc) Error() string {
	return fmt.Sprintf("Rpc: %s", err.message)
}

func (self SpawnErrorRpc) Is(target error) bool {
	return target == ErrSpawnErrorRpc
}

type FfiConverterSpawnError struct{}

var FfiConverterSpawnErrorINSTANCE = FfiConverterSpawnError{}

func (c FfiConverterSpawnError) Lift(eb RustBufferI) *SpawnError {
	return LiftFromRustBuffer[*SpawnError](c, eb)
}

func (c FfiConverterSpawnError) Lower(value *SpawnError) C.RustBuffer {
	return LowerIntoRustBuffer[*SpawnError](c, value)
}

func (c FfiConverterSpawnError) LowerExternal(value *SpawnError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*SpawnError](c, value))
}

func (c FfiConverterSpawnError) Read(reader io.Reader) *SpawnError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &SpawnError{&SpawnErrorSpawn{message}}
	case 2:
		return &SpawnError{&SpawnErrorNodeBuilder{message}}
	case 3:
		return &SpawnError{&SpawnErrorRpc{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterSpawnError.Read()", errorID))
	}

}

func (c FfiConverterSpawnError) Write(writer io.Writer, value *SpawnError) {
	switch variantValue := value.err.(type) {
	case *SpawnErrorSpawn:
		writeInt32(writer, 1)
	case *SpawnErrorNodeBuilder:
		writeInt32(writer, 2)
	case *SpawnErrorRpc:
		writeInt32(writer, 3)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterSpawnError.Write", value))
	}
}

type FfiDestroyerSpawnError struct{}

func (_ FfiDestroyerSpawnError) Destroy(value *SpawnError) {
	switch variantValue := value.err.(type) {
	case SpawnErrorSpawn:
		variantValue.destroy()
	case SpawnErrorNodeBuilder:
		variantValue.destroy()
	case SpawnErrorRpc:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerSpawnError.Destroy", value))
	}
}

type StreamError struct {
	err error
}

// Convenience method to turn *StreamError into error
// Avoiding treating nil pointer as non nil error interface
func (err *StreamError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err StreamError) Error() string {
	return fmt.Sprintf("StreamError: %s", err.err.Error())
}

func (err StreamError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrStreamErrorProcessingFailed = fmt.Errorf("StreamErrorProcessingFailed")
var ErrStreamErrorDecodeFailed = fmt.Errorf("StreamErrorDecodeFailed")
var ErrStreamErrorReplayFailed = fmt.Errorf("StreamErrorReplayFailed")
var ErrStreamErrorAckFailed = fmt.Errorf("StreamErrorAckFailed")

// Variant structs
type StreamErrorProcessingFailed struct {
	message string
}

func NewStreamErrorProcessingFailed() *StreamError {
	return &StreamError{err: &StreamErrorProcessingFailed{}}
}

func (e StreamErrorProcessingFailed) destroy() {
}

func (err StreamErrorProcessingFailed) Error() string {
	return fmt.Sprintf("ProcessingFailed: %s", err.message)
}

func (self StreamErrorProcessingFailed) Is(target error) bool {
	return target == ErrStreamErrorProcessingFailed
}

type StreamErrorDecodeFailed struct {
	message string
}

func NewStreamErrorDecodeFailed() *StreamError {
	return &StreamError{err: &StreamErrorDecodeFailed{}}
}

func (e StreamErrorDecodeFailed) destroy() {
}

func (err StreamErrorDecodeFailed) Error() string {
	return fmt.Sprintf("DecodeFailed: %s", err.message)
}

func (self StreamErrorDecodeFailed) Is(target error) bool {
	return target == ErrStreamErrorDecodeFailed
}

type StreamErrorReplayFailed struct {
	message string
}

func NewStreamErrorReplayFailed() *StreamError {
	return &StreamError{err: &StreamErrorReplayFailed{}}
}

func (e StreamErrorReplayFailed) destroy() {
}

func (err StreamErrorReplayFailed) Error() string {
	return fmt.Sprintf("ReplayFailed: %s", err.message)
}

func (self StreamErrorReplayFailed) Is(target error) bool {
	return target == ErrStreamErrorReplayFailed
}

type StreamErrorAckFailed struct {
	message string
}

func NewStreamErrorAckFailed() *StreamError {
	return &StreamError{err: &StreamErrorAckFailed{}}
}

func (e StreamErrorAckFailed) destroy() {
}

func (err StreamErrorAckFailed) Error() string {
	return fmt.Sprintf("AckFailed: %s", err.message)
}

func (self StreamErrorAckFailed) Is(target error) bool {
	return target == ErrStreamErrorAckFailed
}

type FfiConverterStreamError struct{}

var FfiConverterStreamErrorINSTANCE = FfiConverterStreamError{}

func (c FfiConverterStreamError) Lift(eb RustBufferI) *StreamError {
	return LiftFromRustBuffer[*StreamError](c, eb)
}

func (c FfiConverterStreamError) Lower(value *StreamError) C.RustBuffer {
	return LowerIntoRustBuffer[*StreamError](c, value)
}

func (c FfiConverterStreamError) LowerExternal(value *StreamError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*StreamError](c, value))
}

func (c FfiConverterStreamError) Read(reader io.Reader) *StreamError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &StreamError{&StreamErrorProcessingFailed{message}}
	case 2:
		return &StreamError{&StreamErrorDecodeFailed{message}}
	case 3:
		return &StreamError{&StreamErrorReplayFailed{message}}
	case 4:
		return &StreamError{&StreamErrorAckFailed{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterStreamError.Read()", errorID))
	}

}

func (c FfiConverterStreamError) Write(writer io.Writer, value *StreamError) {
	switch variantValue := value.err.(type) {
	case *StreamErrorProcessingFailed:
		writeInt32(writer, 1)
	case *StreamErrorDecodeFailed:
		writeInt32(writer, 2)
	case *StreamErrorReplayFailed:
		writeInt32(writer, 3)
	case *StreamErrorAckFailed:
		writeInt32(writer, 4)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterStreamError.Write", value))
	}
}

type FfiDestroyerStreamError struct{}

func (_ FfiDestroyerStreamError) Destroy(value *StreamError) {
	switch variantValue := value.err.(type) {
	case StreamErrorProcessingFailed:
		variantValue.destroy()
	case StreamErrorDecodeFailed:
		variantValue.destroy()
	case StreamErrorReplayFailed:
		variantValue.destroy()
	case StreamErrorAckFailed:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerStreamError.Destroy", value))
	}
}

type StreamEvent interface {
	Destroy()
}
type StreamEventSyncStarted struct {
	RemoteNodeId       *PublicKey
	SessionId          uint64
	IncomingOperations uint64
	OutgoingOperations uint64
	IncomingBytes      uint64
	OutgoingBytes      uint64
	TopicSessions      uint64
}

func (e StreamEventSyncStarted) Destroy() {
	FfiDestroyerPublicKey{}.Destroy(e.RemoteNodeId)
	FfiDestroyerUint64{}.Destroy(e.SessionId)
	FfiDestroyerUint64{}.Destroy(e.IncomingOperations)
	FfiDestroyerUint64{}.Destroy(e.OutgoingOperations)
	FfiDestroyerUint64{}.Destroy(e.IncomingBytes)
	FfiDestroyerUint64{}.Destroy(e.OutgoingBytes)
	FfiDestroyerUint64{}.Destroy(e.TopicSessions)
}

type StreamEventSyncEnded struct {
	RemoteNodeId            *PublicKey
	SessionId               uint64
	SentOperations          uint64
	ReceivedOperations      uint64
	SentBytes               uint64
	ReceivedBytes           uint64
	SentBytesTopicTotal     uint64
	ReceivedBytesTopicTotal uint64
	Error                   **SyncError
}

func (e StreamEventSyncEnded) Destroy() {
	FfiDestroyerPublicKey{}.Destroy(e.RemoteNodeId)
	FfiDestroyerUint64{}.Destroy(e.SessionId)
	FfiDestroyerUint64{}.Destroy(e.SentOperations)
	FfiDestroyerUint64{}.Destroy(e.ReceivedOperations)
	FfiDestroyerUint64{}.Destroy(e.SentBytes)
	FfiDestroyerUint64{}.Destroy(e.ReceivedBytes)
	FfiDestroyerUint64{}.Destroy(e.SentBytesTopicTotal)
	FfiDestroyerUint64{}.Destroy(e.ReceivedBytesTopicTotal)
	FfiDestroyerOptionalSyncError{}.Destroy(e.Error)
}

type FfiConverterStreamEvent struct{}

var FfiConverterStreamEventINSTANCE = FfiConverterStreamEvent{}

func (c FfiConverterStreamEvent) Lift(rb RustBufferI) StreamEvent {
	return LiftFromRustBuffer[StreamEvent](c, rb)
}

func (c FfiConverterStreamEvent) Lower(value StreamEvent) C.RustBuffer {
	return LowerIntoRustBuffer[StreamEvent](c, value)
}

func (c FfiConverterStreamEvent) LowerExternal(value StreamEvent) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[StreamEvent](c, value))
}
func (FfiConverterStreamEvent) Read(reader io.Reader) StreamEvent {
	id := readInt32(reader)
	switch id {
	case 1:
		return StreamEventSyncStarted{
			FfiConverterPublicKeyINSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
		}
	case 2:
		return StreamEventSyncEnded{
			FfiConverterPublicKeyINSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterUint64INSTANCE.Read(reader),
			FfiConverterOptionalSyncErrorINSTANCE.Read(reader),
		}
	default:
		panic(fmt.Sprintf("invalid enum value %v in FfiConverterStreamEvent.Read()", id))
	}
}

func (FfiConverterStreamEvent) Write(writer io.Writer, value StreamEvent) {
	switch variant_value := value.(type) {
	case StreamEventSyncStarted:
		writeInt32(writer, 1)
		FfiConverterPublicKeyINSTANCE.Write(writer, variant_value.RemoteNodeId)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SessionId)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.IncomingOperations)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.OutgoingOperations)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.IncomingBytes)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.OutgoingBytes)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.TopicSessions)
	case StreamEventSyncEnded:
		writeInt32(writer, 2)
		FfiConverterPublicKeyINSTANCE.Write(writer, variant_value.RemoteNodeId)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SessionId)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SentOperations)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.ReceivedOperations)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SentBytes)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.ReceivedBytes)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.SentBytesTopicTotal)
		FfiConverterUint64INSTANCE.Write(writer, variant_value.ReceivedBytesTopicTotal)
		FfiConverterOptionalSyncErrorINSTANCE.Write(writer, variant_value.Error)
	default:
		_ = variant_value
		panic(fmt.Sprintf("invalid enum value `%v` in FfiConverterStreamEvent.Write", value))
	}
}

type FfiDestroyerStreamEvent struct{}

func (_ FfiDestroyerStreamEvent) Destroy(value StreamEvent) {
	value.Destroy()
}

type StreamFrom interface {
	Destroy()
}
type StreamFromStart struct {
}

func (e StreamFromStart) Destroy() {
}

type StreamFromFrontier struct {
}

func (e StreamFromFrontier) Destroy() {
}

type StreamFromCursor struct {
	Field0 *Cursor
}

func (e StreamFromCursor) Destroy() {
	FfiDestroyerCursor{}.Destroy(e.Field0)
}

type FfiConverterStreamFrom struct{}

var FfiConverterStreamFromINSTANCE = FfiConverterStreamFrom{}

func (c FfiConverterStreamFrom) Lift(rb RustBufferI) StreamFrom {
	return LiftFromRustBuffer[StreamFrom](c, rb)
}

func (c FfiConverterStreamFrom) Lower(value StreamFrom) C.RustBuffer {
	return LowerIntoRustBuffer[StreamFrom](c, value)
}

func (c FfiConverterStreamFrom) LowerExternal(value StreamFrom) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[StreamFrom](c, value))
}
func (FfiConverterStreamFrom) Read(reader io.Reader) StreamFrom {
	id := readInt32(reader)
	switch id {
	case 1:
		return StreamFromStart{}
	case 2:
		return StreamFromFrontier{}
	case 3:
		return StreamFromCursor{
			FfiConverterCursorINSTANCE.Read(reader),
		}
	default:
		panic(fmt.Sprintf("invalid enum value %v in FfiConverterStreamFrom.Read()", id))
	}
}

func (FfiConverterStreamFrom) Write(writer io.Writer, value StreamFrom) {
	switch variant_value := value.(type) {
	case StreamFromStart:
		writeInt32(writer, 1)
	case StreamFromFrontier:
		writeInt32(writer, 2)
	case StreamFromCursor:
		writeInt32(writer, 3)
		FfiConverterCursorINSTANCE.Write(writer, variant_value.Field0)
	default:
		_ = variant_value
		panic(fmt.Sprintf("invalid enum value `%v` in FfiConverterStreamFrom.Write", value))
	}
}

type FfiDestroyerStreamFrom struct{}

func (_ FfiDestroyerStreamFrom) Destroy(value StreamFrom) {
	value.Destroy()
}

type SyncError struct {
	err error
}

// Convenience method to turn *SyncError into error
// Avoiding treating nil pointer as non nil error interface
func (err *SyncError) AsError() error {
	if err == nil {
		return nil
	} else {
		return err
	}
}

func (err SyncError) Error() string {
	return fmt.Sprintf("SyncError: %s", err.err.Error())
}

func (err SyncError) Unwrap() error {
	return err.err
}

// Err* are used for checking error type with `errors.Is`
var ErrSyncErrorSyncError = fmt.Errorf("SyncErrorSyncError")

// Variant structs
type SyncErrorSyncError struct {
	message string
}

func NewSyncErrorSyncError() *SyncError {
	return &SyncError{err: &SyncErrorSyncError{}}
}

func (e SyncErrorSyncError) destroy() {
}

func (err SyncErrorSyncError) Error() string {
	return fmt.Sprintf("SyncError: %s", err.message)
}

func (self SyncErrorSyncError) Is(target error) bool {
	return target == ErrSyncErrorSyncError
}

type FfiConverterSyncError struct{}

var FfiConverterSyncErrorINSTANCE = FfiConverterSyncError{}

func (c FfiConverterSyncError) Lift(eb RustBufferI) *SyncError {
	return LiftFromRustBuffer[*SyncError](c, eb)
}

func (c FfiConverterSyncError) Lower(value *SyncError) C.RustBuffer {
	return LowerIntoRustBuffer[*SyncError](c, value)
}

func (c FfiConverterSyncError) LowerExternal(value *SyncError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*SyncError](c, value))
}

func (c FfiConverterSyncError) Read(reader io.Reader) *SyncError {
	errorID := readUint32(reader)

	message := FfiConverterStringINSTANCE.Read(reader)
	switch errorID {
	case 1:
		return &SyncError{&SyncErrorSyncError{message}}
	default:
		panic(fmt.Sprintf("Unknown error code %d in FfiConverterSyncError.Read()", errorID))
	}

}

func (c FfiConverterSyncError) Write(writer io.Writer, value *SyncError) {
	switch variantValue := value.err.(type) {
	case *SyncErrorSyncError:
		writeInt32(writer, 1)
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiConverterSyncError.Write", value))
	}
}

type FfiDestroyerSyncError struct{}

func (_ FfiDestroyerSyncError) Destroy(value *SyncError) {
	switch variantValue := value.err.(type) {
	case SyncErrorSyncError:
		variantValue.destroy()
	default:
		_ = variantValue
		panic(fmt.Sprintf("invalid error value `%v` in FfiDestroyerSyncError.Destroy", value))
	}
}

type FfiConverterOptionalBytes struct{}

var FfiConverterOptionalBytesINSTANCE = FfiConverterOptionalBytes{}

func (c FfiConverterOptionalBytes) Lift(rb RustBufferI) *[]byte {
	return LiftFromRustBuffer[*[]byte](c, rb)
}

func (_ FfiConverterOptionalBytes) Read(reader io.Reader) *[]byte {
	if readInt8(reader) == 0 {
		return nil
	}
	temp := FfiConverterBytesINSTANCE.Read(reader)
	return &temp
}

func (c FfiConverterOptionalBytes) Lower(value *[]byte) C.RustBuffer {
	return LowerIntoRustBuffer[*[]byte](c, value)
}

func (c FfiConverterOptionalBytes) LowerExternal(value *[]byte) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[*[]byte](c, value))
}

func (_ FfiConverterOptionalBytes) Write(writer io.Writer, value *[]byte) {
	if value == nil {
		writeInt8(writer, 0)
	} else {
		writeInt8(writer, 1)
		FfiConverterBytesINSTANCE.Write(writer, *value)
	}
}

type FfiDestroyerOptionalBytes struct{}

func (_ FfiDestroyerOptionalBytes) Destroy(value *[]byte) {
	if value != nil {
		FfiDestroyerBytes{}.Destroy(*value)
	}
}

type FfiConverterOptionalHash struct{}

var FfiConverterOptionalHashINSTANCE = FfiConverterOptionalHash{}

func (c FfiConverterOptionalHash) Lift(rb RustBufferI) **Hash {
	return LiftFromRustBuffer[**Hash](c, rb)
}

func (_ FfiConverterOptionalHash) Read(reader io.Reader) **Hash {
	if readInt8(reader) == 0 {
		return nil
	}
	temp := FfiConverterHashINSTANCE.Read(reader)
	return &temp
}

func (c FfiConverterOptionalHash) Lower(value **Hash) C.RustBuffer {
	return LowerIntoRustBuffer[**Hash](c, value)
}

func (c FfiConverterOptionalHash) LowerExternal(value **Hash) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[**Hash](c, value))
}

func (_ FfiConverterOptionalHash) Write(writer io.Writer, value **Hash) {
	if value == nil {
		writeInt8(writer, 0)
	} else {
		writeInt8(writer, 1)
		FfiConverterHashINSTANCE.Write(writer, *value)
	}
}

type FfiDestroyerOptionalHash struct{}

func (_ FfiDestroyerOptionalHash) Destroy(value **Hash) {
	if value != nil {
		FfiDestroyerHash{}.Destroy(*value)
	}
}

type FfiConverterOptionalSyncError struct{}

var FfiConverterOptionalSyncErrorINSTANCE = FfiConverterOptionalSyncError{}

func (c FfiConverterOptionalSyncError) Lift(rb RustBufferI) **SyncError {
	return LiftFromRustBuffer[**SyncError](c, rb)
}

func (_ FfiConverterOptionalSyncError) Read(reader io.Reader) **SyncError {
	if readInt8(reader) == 0 {
		return nil
	}
	temp := FfiConverterSyncErrorINSTANCE.Read(reader)
	return &temp
}

func (c FfiConverterOptionalSyncError) Lower(value **SyncError) C.RustBuffer {
	return LowerIntoRustBuffer[**SyncError](c, value)
}

func (c FfiConverterOptionalSyncError) LowerExternal(value **SyncError) ExternalCRustBuffer {
	return RustBufferFromC(LowerIntoRustBuffer[**SyncError](c, value))
}

func (_ FfiConverterOptionalSyncError) Write(writer io.Writer, value **SyncError) {
	if value == nil {
		writeInt8(writer, 0)
	} else {
		writeInt8(writer, 1)
		FfiConverterSyncErrorINSTANCE.Write(writer, *value)
	}
}

type FfiDestroyerOptionalSyncError struct{}

func (_ FfiDestroyerOptionalSyncError) Destroy(value **SyncError) {
	if value != nil {
		FfiDestroyerSyncError{}.Destroy(*value)
	}
}

const (
	uniffiRustFuturePollReady      int8 = 0
	uniffiRustFuturePollMaybeReady int8 = 1
)

type rustFuturePollFunc func(C.uint64_t, C.UniffiRustFutureContinuationCallback, C.uint64_t)
type rustFutureCompleteFunc[T any] func(C.uint64_t, *C.RustCallStatus) T
type rustFutureFreeFunc func(C.uint64_t)

//export p2panda_ffi_uniffiFutureContinuationCallback
func p2panda_ffi_uniffiFutureContinuationCallback(data C.uint64_t, pollResult C.int8_t) {
	h := cgo.Handle(uintptr(data))
	waiter := h.Value().(chan int8)
	waiter <- int8(pollResult)
}

func uniffiRustCallAsync[E any, T any, F any](
	errConverter BufReader[E],
	completeFunc rustFutureCompleteFunc[F],
	liftFunc func(F) T,
	rustFuture C.uint64_t,
	pollFunc rustFuturePollFunc,
	freeFunc rustFutureFreeFunc,
) (T, E) {
	defer freeFunc(rustFuture)

	pollResult := int8(-1)
	waiter := make(chan int8, 1)

	chanHandle := cgo.NewHandle(waiter)
	defer chanHandle.Delete()

	for pollResult != uniffiRustFuturePollReady {
		pollFunc(
			rustFuture,
			(C.UniffiRustFutureContinuationCallback)(C.p2panda_ffi_uniffiFutureContinuationCallback),
			C.uint64_t(chanHandle),
		)
		pollResult = <-waiter
	}

	var goValue T
	ffiValue, err := rustCallWithError(errConverter, func(status *C.RustCallStatus) F {
		return completeFunc(rustFuture, status)
	})
	if value := reflect.ValueOf(err); value.IsValid() && !value.IsZero() {
		return goValue, err
	}
	return liftFunc(ffiValue), err
}

//export p2panda_ffi_uniffiFreeGorutine
func p2panda_ffi_uniffiFreeGorutine(data C.uint64_t) {
	handle := cgo.Handle(uintptr(data))
	defer handle.Delete()

	guard := handle.Value().(chan struct{})
	guard <- struct{}{}
}
