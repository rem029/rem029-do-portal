import * as migration_20251113_110704_initial_schema_push from './20251113_110704_initial_schema_push';
import * as migration_20251202_114210_add_user_access_old_id_migration_column from './20251202_114210_add_user_access_old_id_migration_column';
import * as migration_20251203_104036_users_update_verified_token_add from './20251203_104036_users_update_verified_token_add';
import * as migration_20251203_105000_add_auth_method_to_users from './20251203_105000_add_auth_method_to_users';
import * as migration_20251207_080659_initial_audit_logs_create_table from './20251207_080659_initial_audit_logs_create_table';
import * as migration_20260105_142105_added_migration_for_h2a_oasys_settings from './20260105_142105_added_migration_for_h2a_oasys_settings';
import * as migration_20260107_112502_added_e_recognition_collection from './20260107_112502_added_e_recognition_collection';
import * as migration_20260113_111442_users_add_auth_method from './20260113_111442_users_add_auth_method';
import * as migration_20260122_130743_added_department_and_operators from './20260122_130743_added_department_and_operators';
import * as migration_20260122_130827_hr_requests_and_business_justifications_settings from './20260122_130827_hr_requests_and_business_justifications_settings';
import * as migration_20260122_130850_add_internal_media from './20260122_130850_add_internal_media';
import * as migration_20260122_132233_add_workflow_collection from './20260122_132233_add_workflow_collection';
import * as migration_20260123_172947_add_hr_requests_and_final_approval_column_at_workflow from './20260123_172947_add_hr_requests_and_final_approval_column_at_workflow';
import * as migration_20260123_173026_add_business_justification_requests from './20260123_173026_add_business_justification_requests';
import * as migration_20260125_134235_add_column_bypass_time_check_field from './20260125_134235_add_column_bypass_time_check_field';
import * as migration_20260125_134303_add_salary_deduction_and_salary_deduction_settings from './20260125_134303_add_salary_deduction_and_salary_deduction_settings';
import * as migration_20260125_134330_add_offer_letter__and_offer_letter_settings from './20260125_134330_add_offer_letter__and_offer_letter_settings';
import * as migration_20260126_080319_salary_deduction_table__updates from './20260126_080319_salary_deduction_table__updates';
import * as migration_20260126_115748_end_of_service_added from './20260126_115748_end_of_service_added';
import * as migration_20260126_194245_offer_letter_add_missing_field from './20260126_194245_offer_letter_add_missing_field';
import * as migration_20260126_220253_added_recruitment_note_collection from './20260126_220253_added_recruitment_note_collection';
import * as migration_20260128_065127_users_add_field_is_disabled from './20260128_065127_users_add_field_is_disabled';
import * as migration_20260129_110905_operator_add_h2a_division_id from './20260129_110905_operator_add_h2a_division_id';
import * as migration_20260129_124523_update_h2a_oasys_settings_add_division_relation_to_operator from './20260129_124523_update_h2a_oasys_settings_add_division_relation_to_operator';
import * as migration_20260130_220449_salaary_deduction_add_employee_reltion_to_user from './20260130_220449_salaary_deduction_add_employee_reltion_to_user';
import * as migration_20260131_205045_salary_deduction_rename_user_to_employee from './20260131_205045_salary_deduction_rename_user_to_employee';
import * as migration_20260131_225215_workflow_updates from './20260131_225215_workflow_updates';
import * as migration_20260131_234149_employee_history_added from './20260131_234149_employee_history_added';
import * as migration_20260201_062826_remove_auditor_logger_plugin from './20260201_062826_remove_auditor_logger_plugin';
import * as migration_20260202_080708_delete_salary_deduction_table from './20260202_080708_delete_salary_deduction_table';
import * as migration_20260202_131134_recreate_salary_deduction from './20260202_131134_recreate_salary_deduction';
import * as migration_20260203_114407_payload_jobs_add_h2a_oasys_sync_users from './20260203_114407_payload_jobs_add_h2a_oasys_sync_users';
import * as migration_20260203_144256_workflow_updated_add_approver_type_as_employee from './20260203_144256_workflow_updated_add_approver_type_as_employee';
import * as migration_20260208_141503_add_form_builder from './20260208_141503_add_form_builder';
import * as migration_20260208_205215_add_forms_plugin_collection_slug from './20260208_205215_add_forms_plugin_collection_slug';
import * as migration_20260209_074708_forms_update_config from './20260209_074708_forms_update_config';
import * as migration_20260209_130905_forms_add_bg_image_and_header from './20260209_130905_forms_add_bg_image_and_header';
import * as migration_20260215_113209_workflow_add_approve_and_rejected_tokens from './20260215_113209_workflow_add_approve_and_rejected_tokens';
import * as migration_20260215_113524_lacigale_fb_sales_add_collections from './20260215_113524_lacigale_fb_sales_add_collections';
import * as migration_20260216_065804_services_workflow_changes from './20260216_065804_services_workflow_changes';
import * as migration_20260218_081117_remove_other_unused_services from './20260218_081117_remove_other_unused_services';
import * as migration_20260218_085115_add_lacigale_sales_module from './20260218_085115_add_lacigale_sales_module';
import * as migration_20260218_100531_add_guest_fields_and_totals from './20260218_100531_add_guest_fields_and_totals';
import * as migration_20260218_203542_employee_history_remove_created_and_updated_by from './20260218_203542_employee_history_remove_created_and_updated_by';
import * as migration_20260219_064605_remove_global_hr_requests_settings from './20260219_064605_remove_global_hr_requests_settings';
import * as migration_20260223_104915_added_reusable_audit_logs from './20260223_104915_added_reusable_audit_logs';
import * as migration_20260223_105823_audit_logs_add_login_and_logout_hooks_and_types from './20260223_105823_audit_logs_add_login_and_logout_hooks_and_types';
import * as migration_20260223_115358_add_ip_for_audit_logs from './20260223_115358_add_ip_for_audit_logs';
import * as migration_20260224_063007_audit_log_update_add_type_for_collection_and_globals from './20260224_063007_audit_log_update_add_type_for_collection_and_globals';
import * as migration_20260224_095933_add_analytics_collection_v2 from './20260224_095933_add_analytics_collection_v2';
import * as migration_20260302_071631_migration_fix from './20260302_071631_migration_fix';
import * as migration_20260302_082939_create_h2a_database from './20260302_082939_create_h2a_database';
import * as migration_20260302_112107_h2a_oasys_settings_update_save_to_db_instead_of_json from './20260302_112107_h2a_oasys_settings_update_save_to_db_instead_of_json';
import * as migration_20260303_115901_workflow_token_handling_update from './20260303_115901_workflow_token_handling_update';
import * as migration_20260308_073606_workflow_token_changes_removed_approved_and_rejected_tokens from './20260308_073606_workflow_token_changes_removed_approved_and_rejected_tokens';
import * as migration_20260310_121012_workflow_updates_added_feature_to_attach_and_generate_wordfile from './20260310_121012_workflow_updates_added_feature_to_attach_and_generate_wordfile';
import * as migration_20260329_141337_forms_update_to_support_workflows from './20260329_141337_forms_update_to_support_workflows';
import * as migration_20260401_070440_rename_services_to_letters from './20260401_070440_rename_services_to_letters';
import * as migration_20260402_053848_moved_services_to_letters_and_added_some_fields from './20260402_053848_moved_services_to_letters_and_added_some_fields';
import * as migration_20260402_073242_created_notices_a_combination_of_salary_deduction_and_warnings from './20260402_073242_created_notices_a_combination_of_salary_deduction_and_warnings';
import * as migration_20260405_110457_added_users_settings_and_forms_update_fields from './20260405_110457_added_users_settings_and_forms_update_fields';
import * as migration_20260406_094533_disciplinary_actions_added_and_workflow_custom_fields_update from './20260406_094533_disciplinary_actions_added_and_workflow_custom_fields_update';
import * as migration_20260407_112751_form_workflow_fields_update from './20260407_112751_form_workflow_fields_update';
import * as migration_20260409_055249_add_form_workflow_global_custom_fields from './20260409_055249_add_form_workflow_global_custom_fields';
import * as migration_20260409_115750_workflow_update_add_ignore_updated_checkbox from './20260409_115750_workflow_update_add_ignore_updated_checkbox';
import * as migration_20260413_113059_users_settings_signature_update from './20260413_113059_users_settings_signature_update';
import * as migration_20260414_141315_add_qr_code_on_forms from './20260414_141315_add_qr_code_on_forms';
import * as migration_20260419_112043_forms_added_signature_and_forms_dashboard_remove_created__updated_by_and_hooks from './20260419_112043_forms_added_signature_and_forms_dashboard_remove_created__updated_by_and_hooks';
import * as migration_20260421_222806_add_workflow_approval_rejection_notifications from './20260421_222806_add_workflow_approval_rejection_notifications';
import * as migration_20260422_063145_add_phone_block from './20260422_063145_add_phone_block';
import * as migration_20260422_115633_add_step_notifications from './20260422_115633_add_step_notifications';
import * as migration_20260423_085841_workflow_notification_refactor from './20260423_085841_workflow_notification_refactor';
import * as migration_20260426_114559_workflow_notification_add_created_by from './20260426_114559_workflow_notification_add_created_by';
import * as migration_20260426_122755_add_notify_creator_to_forms from './20260426_122755_add_notify_creator_to_forms';
import * as migration_20260429_065930_restaurant_collections from './20260429_065930_restaurant_collections';
import * as migration_20260429_104804_fnb_menu_collections from './20260429_104804_fnb_menu_collections';
import * as migration_20260430_130412_menu_pages_field_update from './20260430_130412_menu_pages_field_update';
import * as migration_20260512_060023_fnb_menu_updates from './20260512_060023_fnb_menu_updates';
import * as migration_20260514_112251_analytics_add_event_type_search from './20260514_112251_analytics_add_event_type_search';
import * as migration_20260517_113843_fnb_menu_pages_block_add_className from './20260517_113843_fnb_menu_pages_block_add_className';
import * as migration_20260518_110406_add_layout_blocks_components_on__form from './20260518_110406_add_layout_blocks_components_on__form';
import * as migration_20260519_140610_forms_added_new_blocks_select_for_restaurants_operators_locales_and_rich_text from './20260519_140610_forms_added_new_blocks_select_for_restaurants_operators_locales_and_rich_text';
import * as migration_20260520_201604_site_pages_collection_blocks_and_renderer from './20260520_201604_site_pages_collection_blocks_and_renderer';
import * as migration_20260520_213055_site_pages_update_use_daisyui_theme_and_generate_QR_CODE from './20260520_213055_site_pages_update_use_daisyui_theme_and_generate_QR_CODE';
import * as migration_20260524_144521_page_builder_changes__improve_slug_handling from './20260524_144521_page_builder_changes__improve_slug_handling';
import * as migration_20260525_133701_form_add_form_status_for_flexibility from './20260525_133701_form_add_form_status_for_flexibility';
import * as migration_20260602_075916_workflow_add_email_recipient_from_form_email_field from './20260602_075916_workflow_add_email_recipient_from_form_email_field';
import * as migration_20260603_063051_forms_update_add_public_view_for_submissions from './20260603_063051_forms_update_add_public_view_for_submissions';
import * as migration_20260608_072625_forms_update_add_check_admin_link_show from './20260608_072625_forms_update_add_check_admin_link_show';
import * as migration_20260608_110117_forms_blocks_add_element_id from './20260608_110117_forms_blocks_add_element_id';
import * as migration_20260609_125548_forms_update_enable_public_submission from './20260609_125548_forms_update_enable_public_submission';
import * as migration_20260610_084227_clear_jobs_queue from './20260610_084227_clear_jobs_queue';
import * as migration_20260610_090421_payload_jobs_add_h2a_oasys_seed_database from './20260610_090421_payload_jobs_add_h2a_oasys_seed_database';
import * as migration_20260610_090743_payload_jobs_add_send_email from './20260610_090743_payload_jobs_add_send_email';
import * as migration_20260622_075009_forms_add_multi_step_feature from './20260622_075009_forms_add_multi_step_feature';
import * as migration_20260623_122218_form_fields_update_add_variants from './20260623_122218_form_fields_update_add_variants';
import * as migration_20260624_113908_add_workflow_v2_collection from './20260624_113908_add_workflow_v2_collection';
import * as migration_20260705_062611_store_departments_collection_added from './20260705_062611_store_departments_collection_added';
import * as migration_20260706_083031_crm_routing_via_custom_field_department from './20260706_083031_crm_routing_via_custom_field_department';
import * as migration_20260706_113325_custom_field_option_routing_types from './20260706_113325_custom_field_option_routing_types';
import * as migration_20260708_064747_workflow_instances_event_logs from './20260708_064747_workflow_instances_event_logs';
import * as migration_20260712_081028_forms_add_show_no_input_fields from './20260712_081028_forms_add_show_no_input_fields';
import * as migration_20260714_071156_workflow_v2_block_based_field_system_and_unified_approvers from './20260714_071156_workflow_v2_block_based_field_system_and_unified_approvers';
import * as migration_20260714_090000_form_submissions_add_is_archived from './20260714_090000_form_submissions_add_is_archived';
import * as migration_20260714_122034_add_date_and_email_workflow_response_field_blocks from './20260714_122034_add_date_and_email_workflow_response_field_blocks';
import * as migration_20260714_174738_fnb_table_ordering from './20260714_174738_fnb_table_ordering';
import * as migration_20260719_082609_crm_categories_collection_and_case_category_routing from './20260719_082609_crm_categories_collection_and_case_category_routing';
import * as migration_20260721_090000_fnb_order_lifecycle_and_role_panels from './20260721_090000_fnb_order_lifecycle_and_role_panels';
import * as migration_20260725_133700_orders_add_prepared_status from './20260725_133700_orders_add_prepared_status';
import * as migration_20260727_130737_forms_submission_add_is_archived_duplicate from './20260727_130737_forms_submission_add_is_archived_duplicate';
import * as migration_20260727_130835_seed_crm_workflows_and_forms from './20260727_130835_seed_crm_workflows_and_forms';
import * as migration_20260727_131500_workflow_v2_steps_drop_legacy_approver_columns from './20260727_131500_workflow_v2_steps_drop_legacy_approver_columns';
import * as migration_20260805_124428_create_haccp_subsystem_schema from './20260805_124428_create_haccp_subsystem_schema';
import * as migration_20260806_065342_add_haccp_dry_store from './20260806_065342_add_haccp_dry_store';
import * as migration_20260818_115201_orders_initial_schema_for_table_and_orders from './20260818_115201_orders_initial_schema_for_table_and_orders';
import * as migration_20260820_074302_add_haccp_subsystem_collections from './20260820_074302_add_haccp_subsystem_collections';
import * as migration_20260823_055324_add_seat_count_to_tables from './20260823_055324_add_seat_count_to_tables';
import * as migration_20260823_111324_add_seat_number_to_orders from './20260823_111324_add_seat_number_to_orders';
import * as migration_20260823_135439_add_menu_item_modifier_groups from './20260823_135439_add_menu_item_modifier_groups';
import * as migration_20260826_113840_link_shortener_add_type_select_field_for_link_vs_plain_text from './20260826_113840_link_shortener_add_type_select_field_for_link_vs_plain_text';
import * as migration_20260827_075233_forms_is_survey_field_added from './20260827_075233_forms_is_survey_field_added';
import * as migration_20260827_081107_rating_and_scale_form_field_blocks_added from './20260827_081107_rating_and_scale_form_field_blocks_added';
import * as migration_20260827_083818_survey_invitations_collection_added from './20260827_083818_survey_invitations_collection_added';
import * as migration_20260827_093850_forms_submission_survey_code_field_added from './20260827_093850_forms_submission_survey_code_field_added';
import * as migration_20260827_130830_add_haccp_slugs_and_email_arrays from './20260827_130830_add_haccp_slugs_and_email_arrays';
import * as migration_20260827_144620_forms_survey_code_field_added from './20260827_144620_forms_survey_code_field_added';
import * as migration_20260830_073805_add_haccp_outlet_settings_and_checklists_collection from './20260830_073805_add_haccp_outlet_settings_and_checklists_collection';
import * as migration_20260831_074339_survey_send_invitation_global_added from './20260831_074339_survey_send_invitation_global_added';
import * as migration_20260831_082113_clean_haccp_baseline from './20260831_082113_clean_haccp_baseline';
import * as migration_20260901_071707_add_survey_bulk_send_job_task from './20260901_071707_add_survey_bulk_send_job_task';
import * as migration_20260901_075834_add_survey_invitation_send_job_task from './20260901_075834_add_survey_invitation_send_job_task';
import * as migration_20260902_065433_add_guest_name_and_notes_to_orders from './20260902_065433_add_guest_name_and_notes_to_orders';
import * as migration_20260902_130954_add_daily_sequential_order_number from './20260902_130954_add_daily_sequential_order_number';
import * as migration_20260903_112033_add_event_mode_to_menu_pages_and_orders from './20260903_112033_add_event_mode_to_menu_pages_and_orders';
import * as migration_20260903_122107_add_show_prices_to_menu_pages_and_orders from './20260903_122107_add_show_prices_to_menu_pages_and_orders';
import * as migration_20260906_095724_rename_kitchen_panel_to_back_of_house_panel from './20260906_095724_rename_kitchen_panel_to_back_of_house_panel';
import * as migration_20260907_092237_add_fnb_orders_report_global from './20260907_092237_add_fnb_orders_report_global';
import * as migration_20260908_125908_menu_pages_handlers_replace_skip_cashier_step from './20260908_125908_menu_pages_handlers_replace_skip_cashier_step';
import * as migration_20260908_131739_add_fnb_menu_events_collection from './20260908_131739_add_fnb_menu_events_collection';
import * as migration_20260908_140549_orders_add_fulfillment_flow from './20260908_140549_orders_add_fulfillment_flow';
import * as migration_20260909_062507_restaurants_add_event_enabled_flag from './20260909_062507_restaurants_add_event_enabled_flag';
import * as migration_20260909_134804_orders_add_ordering_slug_snapshot from './20260909_134804_orders_add_ordering_slug_snapshot';
import * as migration_20260909_135706_add_fnb_event_staff_collection from './20260909_135706_add_fnb_event_staff_collection';
import * as migration_20260909_143726_add_fnb_event_panel_globals from './20260909_143726_add_fnb_event_panel_globals';
import * as migration_20260909_145154_add_fnb_event_orders_report_global from './20260909_145154_add_fnb_event_orders_report_global';
import * as migration_20260913_084419_fnb_menu_events_display_title_mirror_field_added from './20260913_084419_fnb_menu_events_display_title_mirror_field_added';
import * as migration_20260913_113113_localize_menu_items_modifier_groups_and_options from './20260913_113113_localize_menu_items_modifier_groups_and_options';
import * as migration_20260914_060818_add_qr_code_fields_to_fnb_menu_events from './20260914_060818_add_qr_code_fields_to_fnb_menu_events';
import * as migration_20260914_073535_fnb_menu_events_owners_field_added from './20260914_073535_fnb_menu_events_owners_field_added';
import * as migration_20260914_083104_update_outlet_foreign_keys from './20260914_083104_update_outlet_foreign_keys';
import * as migration_20260915_141758_fnb_menu_events_carousel_images_field from './20260915_141758_fnb_menu_events_carousel_images_field';
import * as migration_20260916_124438_menu_pages_and_events_availability_filter_toggle from './20260916_124438_menu_pages_and_events_availability_filter_toggle';
import * as migration_20260919_072321_add_qa_field_types_collection from './20260919_072321_add_qa_field_types_collection';
import * as migration_20260919_142854_resync_migration_snapshot_after_dev_merge from './20260919_142854_resync_migration_snapshot_after_dev_merge';
import * as migration_20260919_150424_fnb_menu_events_show_notification_default_true from './20260919_150424_fnb_menu_events_show_notification_default_true';
import * as migration_20260919_201700_menu_items_in_stock_flag_added from './20260919_201700_menu_items_in_stock_flag_added';
import * as migration_20260920_110847_trip_scheduling_schema from './20260920_110847_trip_scheduling_schema';
import * as migration_20260920_184820_fnb_menu_events_header_logo_carousel_image_items_title_description_localized from './20260920_184820_fnb_menu_events_header_logo_carousel_image_items_title_description_localized';
import * as migration_20260921_070234_trip_scheduling_staff_voice_review_link_fields_added from './20260921_070234_trip_scheduling_staff_voice_review_link_fields_added';
import * as migration_20260921_110954_add_payload_docusign_global from './20260921_110954_add_payload_docusign_global';
import * as migration_20260921_112824_add_payload_docusign_credential_fields from './20260921_112824_add_payload_docusign_credential_fields';
import * as migration_20260921_125326_add_allowed_origin_field_to_payload_docusign_global from './20260921_125326_add_allowed_origin_field_to_payload_docusign_global';
import * as migration_20260921_132900_payload_docusign_allowed_origin_to_allowed_origins_array from './20260921_132900_payload_docusign_allowed_origin_to_allowed_origins_array';
import * as migration_20260921_144928_docusign_envelopes_tracking_collection from './20260921_144928_docusign_envelopes_tracking_collection';
import * as migration_20260922_082318_docusign_envelopes_trim_status_fields from './20260922_082318_docusign_envelopes_trim_status_fields';
import * as migration_20260922_122724_docusign_envelopes_requested_by_email_added from './20260922_122724_docusign_envelopes_requested_by_email_added';
import * as migration_20260923_051426_trip_scheduling_bookings_completed_at_field_added from './20260923_051426_trip_scheduling_bookings_completed_at_field_added';
import * as migration_20260923_062718_drop_docusign_envelopes_collection from './20260923_062718_drop_docusign_envelopes_collection';
import * as migration_20260923_070753_home_dashboard_settings_global_added from './20260923_070753_home_dashboard_settings_global_added';
import * as migration_20260923_080046_home_dashboard_settings_background_image_field_added from './20260923_080046_home_dashboard_settings_background_image_field_added';
import * as migration_20260923_114705_home_dashboard_settings_dashboard_item_title_added from './20260923_114705_home_dashboard_settings_dashboard_item_title_added';
import * as migration_20260925_205651_workflow_instances_reviews_add_missing_block_field_columns from './20260925_205651_workflow_instances_reviews_add_missing_block_field_columns';
import * as migration_20260926_214024_trip_scheduling_settings_faqs_and_background_images_added from './20260926_214024_trip_scheduling_settings_faqs_and_background_images_added';
import * as migration_20260927_125801_add_trip_scheduling_history_codes from './20260927_125801_add_trip_scheduling_history_codes';
import * as migration_20260928_080709_add_trip_scheduling_settlement_source from './20260928_080709_add_trip_scheduling_settlement_source';
import * as migration_20260928_081757_add_trip_scheduling_lifecycle_job_task from './20260928_081757_add_trip_scheduling_lifecycle_job_task';
import * as migration_20260929_132305_forms_survey_department_block_rating_scale_nested from './20260929_132305_forms_survey_department_block_rating_scale_nested';
import * as migration_20260929_142109_survey_invitations_department_added from './20260929_142109_survey_invitations_department_added';
import * as migration_20260930_082142_resync_migration_snapshot_after_dev_merge from './20260930_082142_resync_migration_snapshot_after_dev_merge';
import * as migration_20260930_142852_survey_report_global from './20260930_142852_survey_report_global';
import * as migration_20261004_122153_resync_migration_snapshot_after_dev_merge from './20261004_122153_resync_migration_snapshot_after_dev_merge'

export const migrations = [
  {
    up: migration_20251113_110704_initial_schema_push.up,
    down: migration_20251113_110704_initial_schema_push.down,
    name: '20251113_110704_initial_schema_push',
  },
  {
    up: migration_20251202_114210_add_user_access_old_id_migration_column.up,
    down: migration_20251202_114210_add_user_access_old_id_migration_column.down,
    name: '20251202_114210_add_user_access_old_id_migration_column',
  },
  {
    up: migration_20251203_104036_users_update_verified_token_add.up,
    down: migration_20251203_104036_users_update_verified_token_add.down,
    name: '20251203_104036_users_update_verified_token_add',
  },
  {
    up: migration_20251203_105000_add_auth_method_to_users.up,
    down: migration_20251203_105000_add_auth_method_to_users.down,
    name: '20251203_105000_add_auth_method_to_users',
  },
  {
    up: migration_20251207_080659_initial_audit_logs_create_table.up,
    down: migration_20251207_080659_initial_audit_logs_create_table.down,
    name: '20251207_080659_initial_audit_logs_create_table',
  },
  {
    up: migration_20260105_142105_added_migration_for_h2a_oasys_settings.up,
    down: migration_20260105_142105_added_migration_for_h2a_oasys_settings.down,
    name: '20260105_142105_added_migration_for_h2a_oasys_settings',
  },
  {
    up: migration_20260107_112502_added_e_recognition_collection.up,
    down: migration_20260107_112502_added_e_recognition_collection.down,
    name: '20260107_112502_added_e_recognition_collection',
  },
  {
    up: migration_20260113_111442_users_add_auth_method.up,
    down: migration_20260113_111442_users_add_auth_method.down,
    name: '20260113_111442_users_add_auth_method',
  },
  {
    up: migration_20260122_130743_added_department_and_operators.up,
    down: migration_20260122_130743_added_department_and_operators.down,
    name: '20260122_130743_added_department_and_operators',
  },
  {
    up: migration_20260122_130827_hr_requests_and_business_justifications_settings.up,
    down: migration_20260122_130827_hr_requests_and_business_justifications_settings.down,
    name: '20260122_130827_hr_requests_and_business_justifications_settings',
  },
  {
    up: migration_20260122_130850_add_internal_media.up,
    down: migration_20260122_130850_add_internal_media.down,
    name: '20260122_130850_add_internal_media',
  },
  {
    up: migration_20260122_132233_add_workflow_collection.up,
    down: migration_20260122_132233_add_workflow_collection.down,
    name: '20260122_132233_add_workflow_collection',
  },
  {
    up: migration_20260123_172947_add_hr_requests_and_final_approval_column_at_workflow.up,
    down: migration_20260123_172947_add_hr_requests_and_final_approval_column_at_workflow.down,
    name: '20260123_172947_add_hr_requests_and_final_approval_column_at_workflow',
  },
  {
    up: migration_20260123_173026_add_business_justification_requests.up,
    down: migration_20260123_173026_add_business_justification_requests.down,
    name: '20260123_173026_add_business_justification_requests',
  },
  {
    up: migration_20260125_134235_add_column_bypass_time_check_field.up,
    down: migration_20260125_134235_add_column_bypass_time_check_field.down,
    name: '20260125_134235_add_column_bypass_time_check_field',
  },
  {
    up: migration_20260125_134303_add_salary_deduction_and_salary_deduction_settings.up,
    down: migration_20260125_134303_add_salary_deduction_and_salary_deduction_settings.down,
    name: '20260125_134303_add_salary_deduction_and_salary_deduction_settings',
  },
  {
    up: migration_20260125_134330_add_offer_letter__and_offer_letter_settings.up,
    down: migration_20260125_134330_add_offer_letter__and_offer_letter_settings.down,
    name: '20260125_134330_add_offer_letter__and_offer_letter_settings',
  },
  {
    up: migration_20260126_080319_salary_deduction_table__updates.up,
    down: migration_20260126_080319_salary_deduction_table__updates.down,
    name: '20260126_080319_salary_deduction_table__updates',
  },
  {
    up: migration_20260126_115748_end_of_service_added.up,
    down: migration_20260126_115748_end_of_service_added.down,
    name: '20260126_115748_end_of_service_added',
  },
  {
    up: migration_20260126_194245_offer_letter_add_missing_field.up,
    down: migration_20260126_194245_offer_letter_add_missing_field.down,
    name: '20260126_194245_offer_letter_add_missing_field',
  },
  {
    up: migration_20260126_220253_added_recruitment_note_collection.up,
    down: migration_20260126_220253_added_recruitment_note_collection.down,
    name: '20260126_220253_added_recruitment_note_collection',
  },
  {
    up: migration_20260128_065127_users_add_field_is_disabled.up,
    down: migration_20260128_065127_users_add_field_is_disabled.down,
    name: '20260128_065127_users_add_field_is_disabled',
  },
  {
    up: migration_20260129_110905_operator_add_h2a_division_id.up,
    down: migration_20260129_110905_operator_add_h2a_division_id.down,
    name: '20260129_110905_operator_add_h2a_division_id',
  },
  {
    up: migration_20260129_124523_update_h2a_oasys_settings_add_division_relation_to_operator.up,
    down: migration_20260129_124523_update_h2a_oasys_settings_add_division_relation_to_operator.down,
    name: '20260129_124523_update_h2a_oasys_settings_add_division_relation_to_operator',
  },
  {
    up: migration_20260130_220449_salaary_deduction_add_employee_reltion_to_user.up,
    down: migration_20260130_220449_salaary_deduction_add_employee_reltion_to_user.down,
    name: '20260130_220449_salaary_deduction_add_employee_reltion_to_user',
  },
  {
    up: migration_20260131_205045_salary_deduction_rename_user_to_employee.up,
    down: migration_20260131_205045_salary_deduction_rename_user_to_employee.down,
    name: '20260131_205045_salary_deduction_rename_user_to_employee',
  },
  {
    up: migration_20260131_225215_workflow_updates.up,
    down: migration_20260131_225215_workflow_updates.down,
    name: '20260131_225215_workflow_updates',
  },
  {
    up: migration_20260131_234149_employee_history_added.up,
    down: migration_20260131_234149_employee_history_added.down,
    name: '20260131_234149_employee_history_added',
  },
  {
    up: migration_20260201_062826_remove_auditor_logger_plugin.up,
    down: migration_20260201_062826_remove_auditor_logger_plugin.down,
    name: '20260201_062826_remove_auditor_logger_plugin',
  },
  {
    up: migration_20260202_080708_delete_salary_deduction_table.up,
    down: migration_20260202_080708_delete_salary_deduction_table.down,
    name: '20260202_080708_delete_salary_deduction_table',
  },
  {
    up: migration_20260202_131134_recreate_salary_deduction.up,
    down: migration_20260202_131134_recreate_salary_deduction.down,
    name: '20260202_131134_recreate_salary_deduction',
  },
  {
    up: migration_20260203_114407_payload_jobs_add_h2a_oasys_sync_users.up,
    down: migration_20260203_114407_payload_jobs_add_h2a_oasys_sync_users.down,
    name: '20260203_114407_payload_jobs_add_h2a_oasys_sync_users',
  },
  {
    up: migration_20260203_144256_workflow_updated_add_approver_type_as_employee.up,
    down: migration_20260203_144256_workflow_updated_add_approver_type_as_employee.down,
    name: '20260203_144256_workflow_updated_add_approver_type_as_employee',
  },
  {
    up: migration_20260208_141503_add_form_builder.up,
    down: migration_20260208_141503_add_form_builder.down,
    name: '20260208_141503_add_form_builder',
  },
  {
    up: migration_20260208_205215_add_forms_plugin_collection_slug.up,
    down: migration_20260208_205215_add_forms_plugin_collection_slug.down,
    name: '20260208_205215_add_forms_plugin_collection_slug',
  },
  {
    up: migration_20260209_074708_forms_update_config.up,
    down: migration_20260209_074708_forms_update_config.down,
    name: '20260209_074708_forms_update_config',
  },
  {
    up: migration_20260209_130905_forms_add_bg_image_and_header.up,
    down: migration_20260209_130905_forms_add_bg_image_and_header.down,
    name: '20260209_130905_forms_add_bg_image_and_header',
  },
  {
    up: migration_20260215_113209_workflow_add_approve_and_rejected_tokens.up,
    down: migration_20260215_113209_workflow_add_approve_and_rejected_tokens.down,
    name: '20260215_113209_workflow_add_approve_and_rejected_tokens',
  },
  {
    up: migration_20260215_113524_lacigale_fb_sales_add_collections.up,
    down: migration_20260215_113524_lacigale_fb_sales_add_collections.down,
    name: '20260215_113524_lacigale_fb_sales_add_collections',
  },
  {
    up: migration_20260216_065804_services_workflow_changes.up,
    down: migration_20260216_065804_services_workflow_changes.down,
    name: '20260216_065804_services_workflow_changes',
  },
  {
    up: migration_20260218_081117_remove_other_unused_services.up,
    down: migration_20260218_081117_remove_other_unused_services.down,
    name: '20260218_081117_remove_other_unused_services',
  },
  {
    up: migration_20260218_085115_add_lacigale_sales_module.up,
    down: migration_20260218_085115_add_lacigale_sales_module.down,
    name: '20260218_085115_add_lacigale_sales_module',
  },
  {
    up: migration_20260218_100531_add_guest_fields_and_totals.up,
    down: migration_20260218_100531_add_guest_fields_and_totals.down,
    name: '20260218_100531_add_guest_fields_and_totals',
  },
  {
    up: migration_20260218_203542_employee_history_remove_created_and_updated_by.up,
    down: migration_20260218_203542_employee_history_remove_created_and_updated_by.down,
    name: '20260218_203542_employee_history_remove_created_and_updated_by',
  },
  {
    up: migration_20260219_064605_remove_global_hr_requests_settings.up,
    down: migration_20260219_064605_remove_global_hr_requests_settings.down,
    name: '20260219_064605_remove_global_hr_requests_settings',
  },
  {
    up: migration_20260223_104915_added_reusable_audit_logs.up,
    down: migration_20260223_104915_added_reusable_audit_logs.down,
    name: '20260223_104915_added_reusable_audit_logs',
  },
  {
    up: migration_20260223_105823_audit_logs_add_login_and_logout_hooks_and_types.up,
    down: migration_20260223_105823_audit_logs_add_login_and_logout_hooks_and_types.down,
    name: '20260223_105823_audit_logs_add_login_and_logout_hooks_and_types',
  },
  {
    up: migration_20260223_115358_add_ip_for_audit_logs.up,
    down: migration_20260223_115358_add_ip_for_audit_logs.down,
    name: '20260223_115358_add_ip_for_audit_logs',
  },
  {
    up: migration_20260224_063007_audit_log_update_add_type_for_collection_and_globals.up,
    down: migration_20260224_063007_audit_log_update_add_type_for_collection_and_globals.down,
    name: '20260224_063007_audit_log_update_add_type_for_collection_and_globals',
  },
  {
    up: migration_20260224_095933_add_analytics_collection_v2.up,
    down: migration_20260224_095933_add_analytics_collection_v2.down,
    name: '20260224_095933_add_analytics_collection_v2',
  },
  {
    up: migration_20260302_071631_migration_fix.up,
    down: migration_20260302_071631_migration_fix.down,
    name: '20260302_071631_migration_fix',
  },
  {
    up: migration_20260302_082939_create_h2a_database.up,
    down: migration_20260302_082939_create_h2a_database.down,
    name: '20260302_082939_create_h2a_database',
  },
  {
    up: migration_20260302_112107_h2a_oasys_settings_update_save_to_db_instead_of_json.up,
    down: migration_20260302_112107_h2a_oasys_settings_update_save_to_db_instead_of_json.down,
    name: '20260302_112107_h2a_oasys_settings_update_save_to_db_instead_of_json',
  },
  {
    up: migration_20260303_115901_workflow_token_handling_update.up,
    down: migration_20260303_115901_workflow_token_handling_update.down,
    name: '20260303_115901_workflow_token_handling_update',
  },
  {
    up: migration_20260308_073606_workflow_token_changes_removed_approved_and_rejected_tokens.up,
    down: migration_20260308_073606_workflow_token_changes_removed_approved_and_rejected_tokens.down,
    name: '20260308_073606_workflow_token_changes_removed_approved_and_rejected_tokens',
  },
  {
    up: migration_20260310_121012_workflow_updates_added_feature_to_attach_and_generate_wordfile.up,
    down: migration_20260310_121012_workflow_updates_added_feature_to_attach_and_generate_wordfile.down,
    name: '20260310_121012_workflow_updates_added_feature_to_attach_and_generate_wordfile',
  },
  {
    up: migration_20260329_141337_forms_update_to_support_workflows.up,
    down: migration_20260329_141337_forms_update_to_support_workflows.down,
    name: '20260329_141337_forms_update_to_support_workflows',
  },
  {
    up: migration_20260401_070440_rename_services_to_letters.up,
    down: migration_20260401_070440_rename_services_to_letters.down,
    name: '20260401_070440_rename_services_to_letters',
  },
  {
    up: migration_20260402_053848_moved_services_to_letters_and_added_some_fields.up,
    down: migration_20260402_053848_moved_services_to_letters_and_added_some_fields.down,
    name: '20260402_053848_moved_services_to_letters_and_added_some_fields',
  },
  {
    up: migration_20260402_073242_created_notices_a_combination_of_salary_deduction_and_warnings.up,
    down: migration_20260402_073242_created_notices_a_combination_of_salary_deduction_and_warnings.down,
    name: '20260402_073242_created_notices_a_combination_of_salary_deduction_and_warnings',
  },
  {
    up: migration_20260405_110457_added_users_settings_and_forms_update_fields.up,
    down: migration_20260405_110457_added_users_settings_and_forms_update_fields.down,
    name: '20260405_110457_added_users_settings_and_forms_update_fields',
  },
  {
    up: migration_20260406_094533_disciplinary_actions_added_and_workflow_custom_fields_update.up,
    down: migration_20260406_094533_disciplinary_actions_added_and_workflow_custom_fields_update.down,
    name: '20260406_094533_disciplinary_actions_added_and_workflow_custom_fields_update',
  },
  {
    up: migration_20260407_112751_form_workflow_fields_update.up,
    down: migration_20260407_112751_form_workflow_fields_update.down,
    name: '20260407_112751_form_workflow_fields_update',
  },
  {
    up: migration_20260409_055249_add_form_workflow_global_custom_fields.up,
    down: migration_20260409_055249_add_form_workflow_global_custom_fields.down,
    name: '20260409_055249_add_form_workflow_global_custom_fields',
  },
  {
    up: migration_20260409_115750_workflow_update_add_ignore_updated_checkbox.up,
    down: migration_20260409_115750_workflow_update_add_ignore_updated_checkbox.down,
    name: '20260409_115750_workflow_update_add_ignore_updated_checkbox',
  },
  {
    up: migration_20260413_113059_users_settings_signature_update.up,
    down: migration_20260413_113059_users_settings_signature_update.down,
    name: '20260413_113059_users_settings_signature_update',
  },
  {
    up: migration_20260414_141315_add_qr_code_on_forms.up,
    down: migration_20260414_141315_add_qr_code_on_forms.down,
    name: '20260414_141315_add_qr_code_on_forms',
  },
  {
    up: migration_20260419_112043_forms_added_signature_and_forms_dashboard_remove_created__updated_by_and_hooks.up,
    down: migration_20260419_112043_forms_added_signature_and_forms_dashboard_remove_created__updated_by_and_hooks.down,
    name: '20260419_112043_forms_added_signature_and_forms_dashboard_remove_created__updated_by_and_hooks',
  },
  {
    up: migration_20260421_222806_add_workflow_approval_rejection_notifications.up,
    down: migration_20260421_222806_add_workflow_approval_rejection_notifications.down,
    name: '20260421_222806_add_workflow_approval_rejection_notifications',
  },
  {
    up: migration_20260422_063145_add_phone_block.up,
    down: migration_20260422_063145_add_phone_block.down,
    name: '20260422_063145_add_phone_block',
  },
  {
    up: migration_20260422_115633_add_step_notifications.up,
    down: migration_20260422_115633_add_step_notifications.down,
    name: '20260422_115633_add_step_notifications',
  },
  {
    up: migration_20260423_085841_workflow_notification_refactor.up,
    down: migration_20260423_085841_workflow_notification_refactor.down,
    name: '20260423_085841_workflow_notification_refactor',
  },
  {
    up: migration_20260426_114559_workflow_notification_add_created_by.up,
    down: migration_20260426_114559_workflow_notification_add_created_by.down,
    name: '20260426_114559_workflow_notification_add_created_by',
  },
  {
    up: migration_20260426_122755_add_notify_creator_to_forms.up,
    down: migration_20260426_122755_add_notify_creator_to_forms.down,
    name: '20260426_122755_add_notify_creator_to_forms',
  },
  {
    up: migration_20260429_065930_restaurant_collections.up,
    down: migration_20260429_065930_restaurant_collections.down,
    name: '20260429_065930_restaurant_collections',
  },
  {
    up: migration_20260429_104804_fnb_menu_collections.up,
    down: migration_20260429_104804_fnb_menu_collections.down,
    name: '20260429_104804_fnb_menu_collections',
  },
  {
    up: migration_20260430_130412_menu_pages_field_update.up,
    down: migration_20260430_130412_menu_pages_field_update.down,
    name: '20260430_130412_menu_pages_field_update',
  },
  {
    up: migration_20260512_060023_fnb_menu_updates.up,
    down: migration_20260512_060023_fnb_menu_updates.down,
    name: '20260512_060023_fnb_menu_updates',
  },
  {
    up: migration_20260514_112251_analytics_add_event_type_search.up,
    down: migration_20260514_112251_analytics_add_event_type_search.down,
    name: '20260514_112251_analytics_add_event_type_search',
  },
  {
    up: migration_20260517_113843_fnb_menu_pages_block_add_className.up,
    down: migration_20260517_113843_fnb_menu_pages_block_add_className.down,
    name: '20260517_113843_fnb_menu_pages_block_add_className',
  },
  {
    up: migration_20260518_110406_add_layout_blocks_components_on__form.up,
    down: migration_20260518_110406_add_layout_blocks_components_on__form.down,
    name: '20260518_110406_add_layout_blocks_components_on__form',
  },
  {
    up: migration_20260519_140610_forms_added_new_blocks_select_for_restaurants_operators_locales_and_rich_text.up,
    down: migration_20260519_140610_forms_added_new_blocks_select_for_restaurants_operators_locales_and_rich_text.down,
    name: '20260519_140610_forms_added_new_blocks_select_for_restaurants_operators_locales_and_rich_text',
  },
  {
    up: migration_20260520_201604_site_pages_collection_blocks_and_renderer.up,
    down: migration_20260520_201604_site_pages_collection_blocks_and_renderer.down,
    name: '20260520_201604_site_pages_collection_blocks_and_renderer',
  },
  {
    up: migration_20260520_213055_site_pages_update_use_daisyui_theme_and_generate_QR_CODE.up,
    down: migration_20260520_213055_site_pages_update_use_daisyui_theme_and_generate_QR_CODE.down,
    name: '20260520_213055_site_pages_update_use_daisyui_theme_and_generate_QR_CODE',
  },
  {
    up: migration_20260524_144521_page_builder_changes__improve_slug_handling.up,
    down: migration_20260524_144521_page_builder_changes__improve_slug_handling.down,
    name: '20260524_144521_page_builder_changes__improve_slug_handling',
  },
  {
    up: migration_20260525_133701_form_add_form_status_for_flexibility.up,
    down: migration_20260525_133701_form_add_form_status_for_flexibility.down,
    name: '20260525_133701_form_add_form_status_for_flexibility',
  },
  {
    up: migration_20260602_075916_workflow_add_email_recipient_from_form_email_field.up,
    down: migration_20260602_075916_workflow_add_email_recipient_from_form_email_field.down,
    name: '20260602_075916_workflow_add_email_recipient_from_form_email_field',
  },
  {
    up: migration_20260603_063051_forms_update_add_public_view_for_submissions.up,
    down: migration_20260603_063051_forms_update_add_public_view_for_submissions.down,
    name: '20260603_063051_forms_update_add_public_view_for_submissions',
  },
  {
    up: migration_20260608_072625_forms_update_add_check_admin_link_show.up,
    down: migration_20260608_072625_forms_update_add_check_admin_link_show.down,
    name: '20260608_072625_forms_update_add_check_admin_link_show',
  },
  {
    up: migration_20260608_110117_forms_blocks_add_element_id.up,
    down: migration_20260608_110117_forms_blocks_add_element_id.down,
    name: '20260608_110117_forms_blocks_add_element_id',
  },
  {
    up: migration_20260609_125548_forms_update_enable_public_submission.up,
    down: migration_20260609_125548_forms_update_enable_public_submission.down,
    name: '20260609_125548_forms_update_enable_public_submission',
  },
  {
    up: migration_20260610_084227_clear_jobs_queue.up,
    down: migration_20260610_084227_clear_jobs_queue.down,
    name: '20260610_084227_clear_jobs_queue',
  },
  {
    up: migration_20260610_090421_payload_jobs_add_h2a_oasys_seed_database.up,
    down: migration_20260610_090421_payload_jobs_add_h2a_oasys_seed_database.down,
    name: '20260610_090421_payload_jobs_add_h2a_oasys_seed_database',
  },
  {
    up: migration_20260610_090743_payload_jobs_add_send_email.up,
    down: migration_20260610_090743_payload_jobs_add_send_email.down,
    name: '20260610_090743_payload_jobs_add_send_email',
  },
  {
    up: migration_20260622_075009_forms_add_multi_step_feature.up,
    down: migration_20260622_075009_forms_add_multi_step_feature.down,
    name: '20260622_075009_forms_add_multi_step_feature',
  },
  {
    up: migration_20260623_122218_form_fields_update_add_variants.up,
    down: migration_20260623_122218_form_fields_update_add_variants.down,
    name: '20260623_122218_form_fields_update_add_variants',
  },
  {
    up: migration_20260624_113908_add_workflow_v2_collection.up,
    down: migration_20260624_113908_add_workflow_v2_collection.down,
    name: '20260624_113908_add_workflow_v2_collection',
  },
  {
    up: migration_20260705_062611_store_departments_collection_added.up,
    down: migration_20260705_062611_store_departments_collection_added.down,
    name: '20260705_062611_store_departments_collection_added',
  },
  {
    up: migration_20260706_083031_crm_routing_via_custom_field_department.up,
    down: migration_20260706_083031_crm_routing_via_custom_field_department.down,
    name: '20260706_083031_crm_routing_via_custom_field_department',
  },
  {
    up: migration_20260706_113325_custom_field_option_routing_types.up,
    down: migration_20260706_113325_custom_field_option_routing_types.down,
    name: '20260706_113325_custom_field_option_routing_types',
  },
  {
    up: migration_20260708_064747_workflow_instances_event_logs.up,
    down: migration_20260708_064747_workflow_instances_event_logs.down,
    name: '20260708_064747_workflow_instances_event_logs',
  },
  {
    up: migration_20260712_081028_forms_add_show_no_input_fields.up,
    down: migration_20260712_081028_forms_add_show_no_input_fields.down,
    name: '20260712_081028_forms_add_show_no_input_fields',
  },
  {
    up: migration_20260714_071156_workflow_v2_block_based_field_system_and_unified_approvers.up,
    down: migration_20260714_071156_workflow_v2_block_based_field_system_and_unified_approvers.down,
    name: '20260714_071156_workflow_v2_block_based_field_system_and_unified_approvers',
  },
  {
    up: migration_20260714_090000_form_submissions_add_is_archived.up,
    down: migration_20260714_090000_form_submissions_add_is_archived.down,
    name: '20260714_090000_form_submissions_add_is_archived',
  },
  {
    up: migration_20260714_122034_add_date_and_email_workflow_response_field_blocks.up,
    down: migration_20260714_122034_add_date_and_email_workflow_response_field_blocks.down,
    name: '20260714_122034_add_date_and_email_workflow_response_field_blocks',
  },
  {
    up: migration_20260714_174738_fnb_table_ordering.up,
    down: migration_20260714_174738_fnb_table_ordering.down,
    name: '20260714_174738_fnb_table_ordering',
  },
  {
    up: migration_20260719_082609_crm_categories_collection_and_case_category_routing.up,
    down: migration_20260719_082609_crm_categories_collection_and_case_category_routing.down,
    name: '20260719_082609_crm_categories_collection_and_case_category_routing',
  },
  {
    up: migration_20260721_090000_fnb_order_lifecycle_and_role_panels.up,
    down: migration_20260721_090000_fnb_order_lifecycle_and_role_panels.down,
    name: '20260721_090000_fnb_order_lifecycle_and_role_panels',
  },
  {
    up: migration_20260725_133700_orders_add_prepared_status.up,
    down: migration_20260725_133700_orders_add_prepared_status.down,
    name: '20260725_133700_orders_add_prepared_status',
  },
  {
    up: migration_20260727_130737_forms_submission_add_is_archived_duplicate.up,
    down: migration_20260727_130737_forms_submission_add_is_archived_duplicate.down,
    name: '20260727_130737_forms_submission_add_is_archived_duplicate',
  },
  {
    up: migration_20260727_130835_seed_crm_workflows_and_forms.up,
    down: migration_20260727_130835_seed_crm_workflows_and_forms.down,
    name: '20260727_130835_seed_crm_workflows_and_forms',
  },
  {
    up: migration_20260727_131500_workflow_v2_steps_drop_legacy_approver_columns.up,
    down: migration_20260727_131500_workflow_v2_steps_drop_legacy_approver_columns.down,
    name: '20260727_131500_workflow_v2_steps_drop_legacy_approver_columns',
  },
  {
    up: migration_20260805_124428_create_haccp_subsystem_schema.up,
    down: migration_20260805_124428_create_haccp_subsystem_schema.down,
    name: '20260805_124428_create_haccp_subsystem_schema',
  },
  {
    up: migration_20260806_065342_add_haccp_dry_store.up,
    down: migration_20260806_065342_add_haccp_dry_store.down,
    name: '20260806_065342_add_haccp_dry_store',
  },
  {
    up: migration_20260818_115201_orders_initial_schema_for_table_and_orders.up,
    down: migration_20260818_115201_orders_initial_schema_for_table_and_orders.down,
    name: '20260818_115201_orders_initial_schema_for_table_and_orders',
  },
  {
    up: migration_20260820_074302_add_haccp_subsystem_collections.up,
    down: migration_20260820_074302_add_haccp_subsystem_collections.down,
    name: '20260820_074302_add_haccp_subsystem_collections',
  },
  {
    up: migration_20260823_055324_add_seat_count_to_tables.up,
    down: migration_20260823_055324_add_seat_count_to_tables.down,
    name: '20260823_055324_add_seat_count_to_tables',
  },
  {
    up: migration_20260823_111324_add_seat_number_to_orders.up,
    down: migration_20260823_111324_add_seat_number_to_orders.down,
    name: '20260823_111324_add_seat_number_to_orders',
  },
  {
    up: migration_20260823_135439_add_menu_item_modifier_groups.up,
    down: migration_20260823_135439_add_menu_item_modifier_groups.down,
    name: '20260823_135439_add_menu_item_modifier_groups',
  },
  {
    up: migration_20260826_113840_link_shortener_add_type_select_field_for_link_vs_plain_text.up,
    down: migration_20260826_113840_link_shortener_add_type_select_field_for_link_vs_plain_text.down,
    name: '20260826_113840_link_shortener_add_type_select_field_for_link_vs_plain_text',
  },
  {
    up: migration_20260827_075233_forms_is_survey_field_added.up,
    down: migration_20260827_075233_forms_is_survey_field_added.down,
    name: '20260827_075233_forms_is_survey_field_added',
  },
  {
    up: migration_20260827_081107_rating_and_scale_form_field_blocks_added.up,
    down: migration_20260827_081107_rating_and_scale_form_field_blocks_added.down,
    name: '20260827_081107_rating_and_scale_form_field_blocks_added',
  },
  {
    up: migration_20260827_083818_survey_invitations_collection_added.up,
    down: migration_20260827_083818_survey_invitations_collection_added.down,
    name: '20260827_083818_survey_invitations_collection_added',
  },
  {
    up: migration_20260827_093850_forms_submission_survey_code_field_added.up,
    down: migration_20260827_093850_forms_submission_survey_code_field_added.down,
    name: '20260827_093850_forms_submission_survey_code_field_added',
  },
  {
    up: migration_20260827_130830_add_haccp_slugs_and_email_arrays.up,
    down: migration_20260827_130830_add_haccp_slugs_and_email_arrays.down,
    name: '20260827_130830_add_haccp_slugs_and_email_arrays',
  },
  {
    up: migration_20260827_144620_forms_survey_code_field_added.up,
    down: migration_20260827_144620_forms_survey_code_field_added.down,
    name: '20260827_144620_forms_survey_code_field_added',
  },
  {
    up: migration_20260830_073805_add_haccp_outlet_settings_and_checklists_collection.up,
    down: migration_20260830_073805_add_haccp_outlet_settings_and_checklists_collection.down,
    name: '20260830_073805_add_haccp_outlet_settings_and_checklists_collection',
  },
  {
    up: migration_20260831_074339_survey_send_invitation_global_added.up,
    down: migration_20260831_074339_survey_send_invitation_global_added.down,
    name: '20260831_074339_survey_send_invitation_global_added',
  },
  {
    up: migration_20260831_082113_clean_haccp_baseline.up,
    down: migration_20260831_082113_clean_haccp_baseline.down,
    name: '20260831_082113_clean_haccp_baseline',
  },
  {
    up: migration_20260901_071707_add_survey_bulk_send_job_task.up,
    down: migration_20260901_071707_add_survey_bulk_send_job_task.down,
    name: '20260901_071707_add_survey_bulk_send_job_task',
  },
  {
    up: migration_20260901_075834_add_survey_invitation_send_job_task.up,
    down: migration_20260901_075834_add_survey_invitation_send_job_task.down,
    name: '20260901_075834_add_survey_invitation_send_job_task',
  },
  {
    up: migration_20260902_065433_add_guest_name_and_notes_to_orders.up,
    down: migration_20260902_065433_add_guest_name_and_notes_to_orders.down,
    name: '20260902_065433_add_guest_name_and_notes_to_orders',
  },
  {
    up: migration_20260902_130954_add_daily_sequential_order_number.up,
    down: migration_20260902_130954_add_daily_sequential_order_number.down,
    name: '20260902_130954_add_daily_sequential_order_number',
  },
  {
    up: migration_20260903_112033_add_event_mode_to_menu_pages_and_orders.up,
    down: migration_20260903_112033_add_event_mode_to_menu_pages_and_orders.down,
    name: '20260903_112033_add_event_mode_to_menu_pages_and_orders',
  },
  {
    up: migration_20260903_122107_add_show_prices_to_menu_pages_and_orders.up,
    down: migration_20260903_122107_add_show_prices_to_menu_pages_and_orders.down,
    name: '20260903_122107_add_show_prices_to_menu_pages_and_orders',
  },
  {
    up: migration_20260906_095724_rename_kitchen_panel_to_back_of_house_panel.up,
    down: migration_20260906_095724_rename_kitchen_panel_to_back_of_house_panel.down,
    name: '20260906_095724_rename_kitchen_panel_to_back_of_house_panel',
  },
  {
    up: migration_20260907_092237_add_fnb_orders_report_global.up,
    down: migration_20260907_092237_add_fnb_orders_report_global.down,
    name: '20260907_092237_add_fnb_orders_report_global',
  },
  {
    up: migration_20260908_125908_menu_pages_handlers_replace_skip_cashier_step.up,
    down: migration_20260908_125908_menu_pages_handlers_replace_skip_cashier_step.down,
    name: '20260908_125908_menu_pages_handlers_replace_skip_cashier_step',
  },
  {
    up: migration_20260908_131739_add_fnb_menu_events_collection.up,
    down: migration_20260908_131739_add_fnb_menu_events_collection.down,
    name: '20260908_131739_add_fnb_menu_events_collection',
  },
  {
    up: migration_20260908_140549_orders_add_fulfillment_flow.up,
    down: migration_20260908_140549_orders_add_fulfillment_flow.down,
    name: '20260908_140549_orders_add_fulfillment_flow',
  },
  {
    up: migration_20260909_062507_restaurants_add_event_enabled_flag.up,
    down: migration_20260909_062507_restaurants_add_event_enabled_flag.down,
    name: '20260909_062507_restaurants_add_event_enabled_flag',
  },
  {
    up: migration_20260909_134804_orders_add_ordering_slug_snapshot.up,
    down: migration_20260909_134804_orders_add_ordering_slug_snapshot.down,
    name: '20260909_134804_orders_add_ordering_slug_snapshot',
  },
  {
    up: migration_20260909_135706_add_fnb_event_staff_collection.up,
    down: migration_20260909_135706_add_fnb_event_staff_collection.down,
    name: '20260909_135706_add_fnb_event_staff_collection',
  },
  {
    up: migration_20260909_143726_add_fnb_event_panel_globals.up,
    down: migration_20260909_143726_add_fnb_event_panel_globals.down,
    name: '20260909_143726_add_fnb_event_panel_globals',
  },
  {
    up: migration_20260909_145154_add_fnb_event_orders_report_global.up,
    down: migration_20260909_145154_add_fnb_event_orders_report_global.down,
    name: '20260909_145154_add_fnb_event_orders_report_global',
  },
  {
    up: migration_20260913_084419_fnb_menu_events_display_title_mirror_field_added.up,
    down: migration_20260913_084419_fnb_menu_events_display_title_mirror_field_added.down,
    name: '20260913_084419_fnb_menu_events_display_title_mirror_field_added',
  },
  {
    up: migration_20260913_113113_localize_menu_items_modifier_groups_and_options.up,
    down: migration_20260913_113113_localize_menu_items_modifier_groups_and_options.down,
    name: '20260913_113113_localize_menu_items_modifier_groups_and_options',
  },
  {
    up: migration_20260914_060818_add_qr_code_fields_to_fnb_menu_events.up,
    down: migration_20260914_060818_add_qr_code_fields_to_fnb_menu_events.down,
    name: '20260914_060818_add_qr_code_fields_to_fnb_menu_events',
  },
  {
    up: migration_20260914_073535_fnb_menu_events_owners_field_added.up,
    down: migration_20260914_073535_fnb_menu_events_owners_field_added.down,
    name: '20260914_073535_fnb_menu_events_owners_field_added',
  },
  {
    up: migration_20260914_083104_update_outlet_foreign_keys.up,
    down: migration_20260914_083104_update_outlet_foreign_keys.down,
    name: '20260914_083104_update_outlet_foreign_keys',
  },
  {
    up: migration_20260915_141758_fnb_menu_events_carousel_images_field.up,
    down: migration_20260915_141758_fnb_menu_events_carousel_images_field.down,
    name: '20260915_141758_fnb_menu_events_carousel_images_field',
  },
  {
    up: migration_20260916_124438_menu_pages_and_events_availability_filter_toggle.up,
    down: migration_20260916_124438_menu_pages_and_events_availability_filter_toggle.down,
    name: '20260916_124438_menu_pages_and_events_availability_filter_toggle',
  },
  {
    up: migration_20260919_072321_add_qa_field_types_collection.up,
    down: migration_20260919_072321_add_qa_field_types_collection.down,
    name: '20260919_072321_add_qa_field_types_collection',
  },
  {
    up: migration_20260919_142854_resync_migration_snapshot_after_dev_merge.up,
    down: migration_20260919_142854_resync_migration_snapshot_after_dev_merge.down,
    name: '20260919_142854_resync_migration_snapshot_after_dev_merge',
  },
  {
    up: migration_20260919_150424_fnb_menu_events_show_notification_default_true.up,
    down: migration_20260919_150424_fnb_menu_events_show_notification_default_true.down,
    name: '20260919_150424_fnb_menu_events_show_notification_default_true',
  },
  {
    up: migration_20260919_201700_menu_items_in_stock_flag_added.up,
    down: migration_20260919_201700_menu_items_in_stock_flag_added.down,
    name: '20260919_201700_menu_items_in_stock_flag_added',
  },
  {
    up: migration_20260920_110847_trip_scheduling_schema.up,
    down: migration_20260920_110847_trip_scheduling_schema.down,
    name: '20260920_110847_trip_scheduling_schema',
  },
  {
    up: migration_20260920_184820_fnb_menu_events_header_logo_carousel_image_items_title_description_localized.up,
    down: migration_20260920_184820_fnb_menu_events_header_logo_carousel_image_items_title_description_localized.down,
    name: '20260920_184820_fnb_menu_events_header_logo_carousel_image_items_title_description_localized',
  },
  {
    up: migration_20260921_070234_trip_scheduling_staff_voice_review_link_fields_added.up,
    down: migration_20260921_070234_trip_scheduling_staff_voice_review_link_fields_added.down,
    name: '20260921_070234_trip_scheduling_staff_voice_review_link_fields_added',
  },
  {
    up: migration_20260921_110954_add_payload_docusign_global.up,
    down: migration_20260921_110954_add_payload_docusign_global.down,
    name: '20260921_110954_add_payload_docusign_global',
  },
  {
    up: migration_20260921_112824_add_payload_docusign_credential_fields.up,
    down: migration_20260921_112824_add_payload_docusign_credential_fields.down,
    name: '20260921_112824_add_payload_docusign_credential_fields',
  },
  {
    up: migration_20260921_125326_add_allowed_origin_field_to_payload_docusign_global.up,
    down: migration_20260921_125326_add_allowed_origin_field_to_payload_docusign_global.down,
    name: '20260921_125326_add_allowed_origin_field_to_payload_docusign_global',
  },
  {
    up: migration_20260921_132900_payload_docusign_allowed_origin_to_allowed_origins_array.up,
    down: migration_20260921_132900_payload_docusign_allowed_origin_to_allowed_origins_array.down,
    name: '20260921_132900_payload_docusign_allowed_origin_to_allowed_origins_array',
  },
  {
    up: migration_20260921_144928_docusign_envelopes_tracking_collection.up,
    down: migration_20260921_144928_docusign_envelopes_tracking_collection.down,
    name: '20260921_144928_docusign_envelopes_tracking_collection',
  },
  {
    up: migration_20260922_082318_docusign_envelopes_trim_status_fields.up,
    down: migration_20260922_082318_docusign_envelopes_trim_status_fields.down,
    name: '20260922_082318_docusign_envelopes_trim_status_fields',
  },
  {
    up: migration_20260922_122724_docusign_envelopes_requested_by_email_added.up,
    down: migration_20260922_122724_docusign_envelopes_requested_by_email_added.down,
    name: '20260922_122724_docusign_envelopes_requested_by_email_added',
  },
  {
    up: migration_20260923_051426_trip_scheduling_bookings_completed_at_field_added.up,
    down: migration_20260923_051426_trip_scheduling_bookings_completed_at_field_added.down,
    name: '20260923_051426_trip_scheduling_bookings_completed_at_field_added',
  },
  {
    up: migration_20260923_062718_drop_docusign_envelopes_collection.up,
    down: migration_20260923_062718_drop_docusign_envelopes_collection.down,
    name: '20260923_062718_drop_docusign_envelopes_collection',
  },
  {
    up: migration_20260923_070753_home_dashboard_settings_global_added.up,
    down: migration_20260923_070753_home_dashboard_settings_global_added.down,
    name: '20260923_070753_home_dashboard_settings_global_added',
  },
  {
    up: migration_20260923_080046_home_dashboard_settings_background_image_field_added.up,
    down: migration_20260923_080046_home_dashboard_settings_background_image_field_added.down,
    name: '20260923_080046_home_dashboard_settings_background_image_field_added',
  },
  {
    up: migration_20260923_114705_home_dashboard_settings_dashboard_item_title_added.up,
    down: migration_20260923_114705_home_dashboard_settings_dashboard_item_title_added.down,
    name: '20260923_114705_home_dashboard_settings_dashboard_item_title_added',
  },
  {
    up: migration_20260925_205651_workflow_instances_reviews_add_missing_block_field_columns.up,
    down: migration_20260925_205651_workflow_instances_reviews_add_missing_block_field_columns.down,
    name: '20260925_205651_workflow_instances_reviews_add_missing_block_field_columns',
  },
  {
    up: migration_20260926_214024_trip_scheduling_settings_faqs_and_background_images_added.up,
    down: migration_20260926_214024_trip_scheduling_settings_faqs_and_background_images_added.down,
    name: '20260926_214024_trip_scheduling_settings_faqs_and_background_images_added',
  },
  {
    up: migration_20260927_125801_add_trip_scheduling_history_codes.up,
    down: migration_20260927_125801_add_trip_scheduling_history_codes.down,
    name: '20260927_125801_add_trip_scheduling_history_codes',
  },
  {
    up: migration_20260928_080709_add_trip_scheduling_settlement_source.up,
    down: migration_20260928_080709_add_trip_scheduling_settlement_source.down,
    name: '20260928_080709_add_trip_scheduling_settlement_source',
  },
  {
    up: migration_20260928_081757_add_trip_scheduling_lifecycle_job_task.up,
    down: migration_20260928_081757_add_trip_scheduling_lifecycle_job_task.down,
    name: '20260928_081757_add_trip_scheduling_lifecycle_job_task',
  },
  {
    up: migration_20260929_132305_forms_survey_department_block_rating_scale_nested.up,
    down: migration_20260929_132305_forms_survey_department_block_rating_scale_nested.down,
    name: '20260929_132305_forms_survey_department_block_rating_scale_nested',
  },
  {
    up: migration_20260929_142109_survey_invitations_department_added.up,
    down: migration_20260929_142109_survey_invitations_department_added.down,
    name: '20260929_142109_survey_invitations_department_added',
  },
  {
    up: migration_20260930_082142_resync_migration_snapshot_after_dev_merge.up,
    down: migration_20260930_082142_resync_migration_snapshot_after_dev_merge.down,
    name: '20260930_082142_resync_migration_snapshot_after_dev_merge',
  },
  {
    up: migration_20260930_142852_survey_report_global.up,
    down: migration_20260930_142852_survey_report_global.down,
    name: '20260930_142852_survey_report_global',
  },
  {
    up: migration_20261004_122153_resync_migration_snapshot_after_dev_merge.up,
    down: migration_20261004_122153_resync_migration_snapshot_after_dev_merge.down,
    name: '20261004_122153_resync_migration_snapshot_after_dev_merge'
  },
];
