export interface FfiMetadata {
  namespace: string;
  cdylibName: string;
  stagedLibraryPackageRelativePath: string;
  bundledPrebuilds: boolean;
  manualLoad: boolean;
}

export interface FfiBindings {
  libraryPath: string;
  packageRelativePath: string | null;
  library: unknown;
  ffiTypes: Readonly<Record<string, unknown>>;
  ffiCallbacks: Readonly<Record<string, unknown>>;
  ffiStructs: Readonly<Record<string, unknown>>;
  ffiFunctions: Readonly<Record<string, (...args: any[]) => any>>;
}

export interface FfiIntegrity {
  contractVersionFunction: string;
  expectedContractVersion: number;
  checksums: Readonly<Record<string, number>>;
}

export interface FfiRuntimeHooks {
  onLoad?(bindings: Readonly<FfiBindings>): void;
  onUnload?(bindings: Readonly<FfiBindings>): void;
}

export declare const ffiMetadata: Readonly<FfiMetadata>;
export declare const ffiIntegrity: Readonly<FfiIntegrity>;
export declare function configureRuntimeHooks(hooks?: FfiRuntimeHooks | null): void;
export declare function load(libraryPath?: string | null): Readonly<FfiBindings>;
export declare function unload(): boolean;
export declare function isLoaded(): boolean;
export declare function getFfiBindings(): Readonly<FfiBindings>;
export declare function getFfiTypes(): Readonly<Record<string, unknown>>;
export declare function getContractVersion(bindings?: Readonly<FfiBindings>): number;
export declare function validateContractVersion(bindings?: Readonly<FfiBindings>): number;
export declare function getChecksums(
  bindings?: Readonly<FfiBindings>,
): Readonly<Record<string, number>>;
export declare function validateChecksums(
  bindings?: Readonly<FfiBindings>,
): Readonly<Record<string, number>>;
export declare const ffiFunctions: Readonly<Record<string, (...args: any[]) => any>>;


export declare function uniffi_p2panda_ffi_fn_clone_nodebuilder(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_nodebuilder(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_nodebuilder_new(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_ack_policy(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v4(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_ip_v6(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v4(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_bind_port_v6(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_bootstrap(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_database_url(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_mdns_mode(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_network_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_private_key(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_relay_url(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_nodebuilder_spawn(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_cursor(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_cursor(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_cursor_name(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_hash_digest(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_hash_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_hash_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_hash_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_hash_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_header(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_header(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_backlink(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_log_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_payload_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_payload_size(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_prune_flag(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_public_key(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_seq_num(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_signature(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_timestamp(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_header_version(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_networkid(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_networkid(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_networkid_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_networkid_from_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_networkid_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_networkid_random(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_networkid_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_networkid_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_privatekey(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_privatekey(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_privatekey_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_privatekey_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_privatekey_generate(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_privatekey_public_key(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_privatekey_sign(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_privatekey_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_privatekey_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_publickey(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_publickey(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_publickey_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_publickey_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_publickey_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_publickey_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_publickey_verify(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_relayurl(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_relayurl(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_relayurl_from_str(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_relayurl_to_str(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_signature(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_signature(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_signature_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_signature_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_signature_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_signature_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_topicid(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_topicid(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_topicid_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_topicid_from_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_topicid_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_topicid_random(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicid_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicid_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_ephemeralmessage(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_ephemeralmessage(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralmessage_author(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralmessage_body(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralmessage_timestamp(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralmessage_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_ephemeralstream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_ephemeralstream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralstream_publish(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralstream_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_ephemeralstreamcallback(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_ephemeralstreamcallback(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_init_callback_vtable_ephemeralstreamcallback(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_ephemeralstreamcallback_on_message(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_node(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_node(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_constructor_node_spawn(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_node_ephemeral_stream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_node_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_node_insert_bootstrap(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_node_network_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_node_stream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_node_stream_from(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_topicstreamcallback(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_topicstreamcallback(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_init_callback_vtable_topicstreamcallback(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_event(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_error(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstreamcallback_on_operation(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_event(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_event(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_event_body(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_event_header(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_event_is_completed(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_event_is_failed(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_processedoperation(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_processedoperation(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_ack(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_author(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_message(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_processed(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_timestamp(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_processedoperation_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_clone_topicstream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_free_topicstream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstream_ack(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstream_prune(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstream_publish(...args: any[]): any;

export declare function uniffi_p2panda_ffi_fn_method_topicstream_topic(...args: any[]): any;

export declare function ffi_p2panda_ffi_rustbuffer_alloc(...args: any[]): any;

export declare function ffi_p2panda_ffi_rustbuffer_from_bytes(...args: any[]): any;

export declare function ffi_p2panda_ffi_rustbuffer_free(...args: any[]): any;

export declare function ffi_p2panda_ffi_rustbuffer_reserve(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_u8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_u8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_u8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_u8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_i8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_i8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_i8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_i8(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_u16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_u16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_u16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_u16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_i16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_i16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_i16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_i16(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_u32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_u32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_u32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_u32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_i32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_i32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_i32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_i32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_u64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_u64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_u64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_u64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_i64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_i64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_i64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_i64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_f32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_f32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_f32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_f32(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_f64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_f64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_f64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_f64(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_rust_buffer(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_rust_buffer(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_rust_buffer(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_rust_buffer(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_poll_void(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_cancel_void(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_free_void(...args: any[]): any;

export declare function ffi_p2panda_ffi_rust_future_complete_void(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_ack_policy(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v4(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_ip_v6(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v4(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_bind_port_v6(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_bootstrap(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_database_url(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_mdns_mode(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_network_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_private_key(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_relay_url(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_nodebuilder_spawn(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_cursor_name(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_hash_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_hash_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_backlink(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_log_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_payload_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_payload_size(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_prune_flag(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_public_key(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_seq_num(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_signature(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_timestamp(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_header_version(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_networkid_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_networkid_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_privatekey_public_key(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_privatekey_sign(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_privatekey_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_privatekey_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_publickey_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_publickey_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_publickey_verify(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_relayurl_to_str(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_signature_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_signature_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicid_to_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicid_to_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_author(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_body(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_timestamp(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralmessage_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralstream_publish(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralstream_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_ephemeralstreamcallback_on_message(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_node_ephemeral_stream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_node_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_node_insert_bootstrap(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_node_network_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_node_stream(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_node_stream_from(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_event(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_error(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstreamcallback_on_operation(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_event_body(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_event_header(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_event_is_completed(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_event_is_failed(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_ack(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_author(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_id(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_message(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_processed(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_timestamp(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_processedoperation_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstream_ack(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstream_prune(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstream_publish(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_method_topicstream_topic(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_nodebuilder_new(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_hash_digest(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_hash_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_hash_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_networkid_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_networkid_from_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_networkid_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_networkid_random(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_privatekey_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_privatekey_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_privatekey_generate(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_publickey_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_publickey_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_relayurl_from_str(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_signature_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_signature_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_topicid_from_bytes(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_topicid_from_hash(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_topicid_from_hex(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_topicid_random(...args: any[]): any;

export declare function uniffi_p2panda_ffi_checksum_constructor_node_spawn(...args: any[]): any;

export declare function ffi_p2panda_ffi_uniffi_contract_version(...args: any[]): any;
