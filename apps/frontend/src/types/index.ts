import { RouteObject } from "react-router-dom";

import { EmployeeWhistleBlowerV2 as EmployeeWhistleBlowerV2Type } from "../types/payload-types";

export interface CareerDefaultProps {
  operator: string;
}

export type themes =
  | "dohaoasis"
  | "dohaoasis-alt"
  | "dohaoasis-new"
  | "printemps"
  | "dohaquest";
export type Language = "en" | "ar" | "fr";
export const LanguageLabel: Record<Language, string> = {
  en: "English",
  ar: "Arabic",
  fr: "French",
};

export type PageConfig = { headerName?: string; theme?: themes };
export type RouterObjectExtended = RouteObject & PageConfig;

export interface FileWithPayloadID extends File {
  id?: string;
}

export interface MediaInternal {
  id?: number;
  alt?: string | null;
  updatedAt?: string;
  createdAt?: string;
  url?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
}
export interface EmployeeWhistleBlower {
  id?: number;
  contact_info?: {
    name?: string | null;
    designation?: string | null;
    department?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  subject_info?: {
    name?: string | null;
    designation?: string | null;
    department?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  witness_info?: {
    name?: string | null;
    designation?: string | null;
    department?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  details?: {
    description?: string | null;
    when?: string | null;
    where?: string | null;
    how?: string | null;
    other_parties_involved?: string | null;
    concerned_about_consequences?: string | null;
    reported_to_employer?: string | null;
    conflicted_individuals?: string | null;
    circumvented_controls?: string | null;
    supporting_docs?:
      | {
          media_internal?: number | MediaInternal | null;
          id?: string | null;
        }[]
      | null;
    other_details?: string | null;
  };
  updatedAt?: string;
  createdAt?: string;
}

export interface EmployeeWhistleBlowerV2 {
  id?: number;
  contact_info?: {
    name?: string | null;
    designation?: string | null;
    department?: (number | null) | Departments;
    operator?: (number | null) | Operator;
    phone?: string | null;
    email?: string | null;
  };
  subject_info?: {
    name?: string | null;
    designation?: string | null;
    department?: (number | null) | Departments;
    operator?: (number | null) | Operator;
    phone?: string | null;
    email?: string | null;
  };
  details?: {
    incident_or_concern?: string | null;
  };
  acknowledgement?: boolean | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface SurveyCustomerFeedbacksPadel {
  id?: number;
  visit_frequency?: ("daily" | "weekly" | "monthly" | "often") | null;
  why_choose_us?:
    | ("facilities" | "location" | "pricing" | "loyalty_program" | "all_above")
    | null;
  discovery_method?: ("social_media" | "friends" | "others") | null;
  discovery_method_others?: string | null;
  satifaction_booking_process?: string | null;
  satifaction_booking_process_time_slots?: string | null;
  court_fees_reasonable?: ("yes" | "no") | null;
  recommend_to_others?: ("yes" | "no") | null;
  recommend_to_others_rating?: string | null;
  additional_amenities_wish?: string | null;
  satifaction_overall_quality?: string | null;
  satifaction_customer_service?: string | null;
  share_experience?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface NetPromoterFeedback {
  visit_date: string; // 'datetimeoffset' translates to a string in ISO format in TypeScript
  receipt_id: string;
  employee_id: string;
  customer_feedback?: string;
  customer_feedback_number?: number;
  customer_comments: string;
  transaction_type: string;
}

export const CustomerRatingOptions: Record<string, number> = {
  Poor: 1,
  Average: 2,
  Good: 3,
  "Very Good": 4,
  Excellent: 5,
};

export const CustomerRatingSatisfactionOptions: Record<string, number> = {
  "Very Dissatisfied": 1,
  Dissatisfied: 2,
  Neutral: 3,
  Satisfied: 4,
  "Very Satisfied": 5,
};

export const EmployeeRatingOptions: Record<string, number> = {
  "Strongly disagree": 1,
  Disagree: 2,
  "I do not know": 3,
  Agree: 4,
  "Strongly agree": 5,
};

export interface SurveyCustomerFeedback {
  visit_date: string; // 'datetimeoffset' translates to a string in ISO format in TypeScript
  visited_restaurant?: string;
  meal_period?: string;
  visit_frequency?: string;
  rating_greeting?: string; // Optional because not marked as NOT NULL
  rating_service?: string;
  rating_beverage?: string;
  rating_food?: string;
  rating_value_for_money?: string;
  rating_cleanliness?: string;
  discovery_method?: string;
  discovery_text?: string;
  will_visit_again?: string;
  manager_visit?: string;
  favorite_restaurant?: string;
  additional_comments?: string; // 'text' translates to string, optional if it can be null
  name?: string;
  telephone_number?: string;
  birth_date?: string; // 'date' translates to a string in ISO format
  email_address?: string;
  marketing_consent?: boolean;
}

export interface CustomerInfo {
  date: string;
  customerName: string;
}

export interface ContentHeader {
  id: string;
  content: string;
  language: string;
}

export interface ContentInfo {
  id: string;
  content: any[];
  language: string;
}

export interface EmployeeQuestion {
  id: string;
  default_title: string;
  default_subtitle: string;
  group_label?: string;
  question_group?: (number | null) | EmployeeQuestionsGroup;
  question_type?: ("rating" | "textarea" | "text") | null;
  item: EmployeeQuestionItem[];
  createdAt: Date;
  updatedAt: Date;
}
export interface EmployeeQuestionItem {
  id: string;
  type: string;
  language: string;
  title: string;
  subtitle?: string;
}

export interface EmployeeQuestionsEmailStatus {
  id?: number;
  anonymous_id?: string | null;
  email?: string | null;
  status?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface EmployeeQuestionsManagement {
  id?: number;
  department?: (number | null) | Departments;
  default_title?: string | null;
  default_subtitle?: string | null;
  item?:
    | {
        type?: ("text" | "checkbox") | null;
        language?: ("en" | "ar" | "fr") | null;
        title?: string | null;
        subtitle?: string | null;
        id?: string | null;
      }[]
    | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface EmployeeResponse {
  anonymousId?: string;
  department: string;
  department_sub: string;
  questions: {
    question_type: string;
    question: string;
    response: string;
    response_text?: string;
  }[];
  employee_comments: string;
}

export interface EmployeeResponsesManagement {
  id?: number;
  anonymousId?: string;
  department?: string | null;
  department_sub?: string | null;
  employee_comments?: string | null;
  questions: { question: string; response: string }[];
  updatedAt?: string;
  createdAt?: string;
}

export interface EmployeeBenefitsTab {
  id: number;
  name: string;
}

export interface Departments {
  id: string;
  name: string;
  department_subs: { id: string; name: string }[];
  updatedAt?: string;
  createdAt?: string;
}

export interface Media {
  id: number;
  alt?: string;
  updatedAt: Date;
  createdAt: Date;
  url: string;
  filename: string;
  mimeType: string;
  filesize: number;
}

export interface BenefitContent {
  id: string;
  name: string;
  benefits: {
    id: string;
    description?: string;
    title: string;
    printemps: string;
    dohaoasis: string;
    banyantree: string;
  }[];
  contact_info: {
    address: string;
    email: string;
    phone: string;
    point_of_contact: string;
  };
  general_info: {
    category: { createdAt: Date; id: number; name: string; updatedAt: Date };
    media?: Media;
  };
  terms_and_condition: any[];
  createdAt: Date;
  updatedAt: Date;
  expiry_date: Date;
  external_link: string;
  attachments?: {
    id: string;
    media: Media;
  }[];
  _status: string;
}

export interface EmployeeBanner {
  id: number;
  name: string;
  media: number | Media;
  updatedAt: string;
  createdAt: string;
  link?: string;
  _status?: ("draft" | "published") | null;
}

export interface OpenAIResponse {
  response: {
    options: {
      method: string;
      path: string;
      query: any;
      headers: {
        "OpenAI-Beta": string;
      };
    };
    response: {
      size: 0;
      timeout: 0;
    };
    body: {
      object: string;
      data: {
        id: string;
        object: string;
        created_at: number;
        assistant_id: string;
        thread_id: string;
        run_id: string;
        role: string;
        content: [
          {
            type: string;
            text: {
              value: string;
              annotations: any[];
            };
          },
        ];
        file_ids: [];
        metadata: {};
      }[];
      first_id: string;
      last_id: string;
      has_more: boolean;
    };
    data: OpenAIResponseData[];
  };
}

export interface OpenAIResponseData {
  id: string;
  object: string;
  created_at: number;
  assistant_id?: string | null;
  thread_id: string;
  run_id?: string | null;
  role: string;
  content: [
    {
      type: string;
      text: {
        value: string;
        annotations?: [
          {
            type: string;
            text: string;
            start_index: number;
            end_index: number;
            file_citation: {
              file_id: string;
              quote: string;
            };
          },
        ];
      };
    },
  ];
  file_ids: [];
  metadata: {};
}

export interface Item {
  id: number;
  name: string;
  description?: string | null;
  items?:
    | {
        values?:
          | {
              key: string;
              value?: string | null;
              id?: string | null;
            }[]
          | null;
        data?:
          | {
              [k: string]: unknown;
            }
          | unknown[]
          | string
          | number
          | boolean
          | null;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}

export interface IflyWaiverFormDependent {
  id?: string;
  name: string;
  qid: string;
  phone?: string | null;
}

export interface IflyWaiverForm {
  id?: number;
  date?: string | null;
  name: string;
  qid: string;
  phone: string;
  dependents?: IflyWaiverFormDependent[];
  signature_svg: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface LaserOasisWaiverFormDependent {
  id?: string;
  name: string;
  qid: string;
  phone?: string | null;
}

export interface LaserOasisWaiverForm {
  id?: number;
  date?: string | null;
  name: string;
  qid: string;
  phone: string;
  dependents?: LaserOasisWaiverFormDependent[];
  signature_svg: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Careers {
  id?: string;
  code?: string | null;
  title: string;
  description?: string;
  department: number | Departments;
  work_type: number | CareersWorkType;
  active?: boolean | null;
  expires_at?: string | null;
  responsibilities?:
    | {
        title?: string | null;
        sub_title?: string | null;
        id?: string | null;
      }[]
    | null;
  qualifications?:
    | {
        title?: string | null;
        sub_title?: string | null;
        id?: string | null;
      }[]
    | null;
  questions?:
    | {
        careers_questions?: (number | null) | CareersQuestion;
        required?: boolean | null;
        id?: string | null;
      }[]
    | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface CareersApplication {
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  nationality: string;
  country_of_residence: string;
  nationalIdPassportNumber: string;
  cover_letter: string;
  resume: number | CareersMedia;
  career: string | Careers;
  career_questions?:
    | {
        item?: (number | null) | CareersQuestion;
        response?: string | null;
        id?: string | null;
      }[]
    | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface CareersContent {
  id?: number;
  careers?: {
    logo?: (number | null) | Media;
    title?: string | null;
    sub_title?: string | null;
  };
  about_us?: {
    logo?: (number | null) | Media;
    title?: string | null;
    sub_title?: string | null;
  };
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface CareersQuestion {
  id?: number;
  title?: string | null;
  description?: string | null;
  type?: ("Text" | "TextArea" | "Number" | "Dropdown") | null;
  options?:
    | {
        title?: string | null;
        id?: string | null;
      }[]
    | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface CareersWorkType {
  id?: number;
  title?: string | null;
  description?: string | null;
  updatedAt?: string;
  createdAt?: string;
}

export interface CareersMedia {
  id?: number;
  alt?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface Raffle974 {
  id?: number;
  full_name: string;
  email: string;
  nationality: string;
  country_of_residence: string;
  accepted_tnc: boolean;
  updatedAt?: string;
  createdAt?: string;
  _status?: ("draft" | "published") | null;
}

export interface Raffle974Setting {
  id?: number;
  Content: {
    content?:
      | {
          [k: string]: unknown;
        }[]
      | null;
  };
  Title: {
    title?:
      | {
          [k: string]: unknown;
        }[]
      | null;
  };
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface EmployeeQuestionsGroup {
  id: number;
  name: string;
  title?: {
    en?: string | null;
    ar?: string | null;
    fr?: string | null;
  };
  show_sub_department?: boolean | null;
  show_additional_comments?: boolean | null;
  departments?: (number | Departments)[] | null;
  created_by?: (number | null) | User;
  updated_by?: (number | null) | User;
  updatedAt: string;
  createdAt: string;
}

export type HeadScripts =
  | {
      type: "external" | "inline" | "custom";
      src?: string | null;
      content?: string | null;
      async?: boolean | null;
      defer?: boolean | null;
      id?: string | null;
    }[]
  | null;

export interface Restaurant {
  id: number;
  logo?: number | Media | null;
  featured_image?: number | Media | null;
  name: string;
  slug: string;
  description?: string | null;
  description_rt?:
    | {
        [k: string]: unknown;
      }[]
    | null;
  scripts?: HeadScripts;
  additional_data?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  created_by?: (number | null) | User;
  updated_by?: (number | null) | User;
  updatedAt: string;
  createdAt: string;
}

export interface User {
  id: number;
  operator?: (number | null) | Operator;
  role?: (number | null) | UserRole;
  access?: (number | null) | UserAccess;
  updatedAt: string;
  createdAt: string;
  enableAPIKey?: boolean | null;
  apiKey?: string | null;
  apiKeyIndex?: string | null;
  email: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  password: string | null;
}

export interface Operator {
  id?: string;
  name?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface UserRole {
  id: number;
  name?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface UserAccess {
  id: number;
  name?: string | null;
  access?:
    | {
        name?: string | null;
        hidden?: boolean | null;
        read?: boolean | null;
        create?: boolean | null;
        update?: boolean | null;
        admin?: boolean | null;
        delete?: boolean | null;
        access?: boolean | null;
        id?: string | null;
      }[]
    | null;
  updatedAt: string;
  createdAt: string;
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "page-content".
 */
export interface PageContent {
  id: number;
  dohaoasis: {
    logo_primary?: number | Media | null;
    logo_secondary?: number | Media | null;
    favicon?: number | Media | null;
    additional_data?:
      | {
          [k: string]: unknown;
        }
      | unknown[]
      | string
      | number
      | boolean
      | null;
  };
  dohaquest: {
    logo_primary?: number | Media | null;
    logo_secondary?: number | Media | null;
    favicon?: number | Media | null;
    additional_data?:
      | {
          [k: string]: unknown;
        }
      | unknown[]
      | string
      | number
      | boolean
      | null;
  };
  printemps: {
    logo_primary?: number | Media | null;
    logo_secondary?: number | Media | null;
    favicon?: number | Media | null;
    additional_data?:
      | {
          [k: string]: unknown;
        }
      | unknown[]
      | string
      | number
      | boolean
      | null;
  };
  updatedAt?: string | null;
  createdAt?: string | null;
}

export interface Analytics {
  id: number;
  eventType: "page_view" | "click" | "form_submission" | "error";
  path: string;
  referrer?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  additionalData?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  updatedAt: string;
  createdAt: string;
}

export interface SurveyWithNetPromoterFeedback
  extends SurveyCustomerFeedback,
    NetPromoterFeedback {
  telephone_number_country: string;
}

export interface PrintempsLoyaltyRegistration {
  id: number;
  visit_date: string;
  store: number | PrintempsLoyaltyRegistrationStore;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date: string;
  gender: "male" | "female";
  nationality: string;
  receipt?: number | PrintempsLoyaltyRegistrationMedia | null;
  updatedAt: string;
  createdAt: string;
}

export interface PrintempsLoyaltyRegistrationStore {
  id: number;
  logo?: number | Media | null;
  featured_image?: number | Media | null;
  name: string;
  slug: string;
  description?: string | null;
  description_rt?:
    | {
        [k: string]: unknown;
      }[]
    | null;
  scripts?: HeadScripts;
  additional_data?:
    | {
        [k: string]: unknown;
      }
    | unknown[]
    | string
    | number
    | boolean
    | null;
  created_by?: (number | null) | User;
  updated_by?: (number | null) | User;
  updatedAt: string;
  createdAt: string;
}

export interface PrintempsLoyaltyRegistrationMedia {
  id: number;
  alt?: string | null;
  created_by?: (number | null) | User;
  updated_by?: (number | null) | User;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface SurveyCustomerSatisfaction {
  id: number;
  store_ambience_cleanliness_rating?: string | null;
  is_product_availability_variety?: string | null;
  product_availability_variety_rating?: string | null;
  rating_customer_service?:
    | (
        | "very-dissatisfied"
        | "dissatisfied"
        | "neutral"
        | "satisfied"
        | "very-satisfied"
      )
    | null;
  is_customer_service_helpful?: string | null;
  checkout_payment_process?: string | null;
  loyalty_program?: string | null;
  rating_loyalty_program_satisfaction?:
    | (
        | "very-dissatisfied"
        | "dissatisfied"
        | "neutral"
        | "satisfied"
        | "very-satisfied"
      )
    | null;
  communication_promotions?: string | null;
  rating_overall_experience?:
    | (
        | "very-dissatisfied"
        | "dissatisfied"
        | "neutral"
        | "satisfied"
        | "very-satisfied"
      )
    | null;
  area_for_improvement?: string | null;
  name?: string | null;
  telephone_number?: string | null;
  telephone_number_country?: string | null;
  birth_date?: string | null;
  email_address?: string | null;
  marketing_consent?: boolean | null;
  updatedAt: string;
  createdAt: string;
}

export interface CustomerSurveySatisfactionsContent {
  id: number;
  header_image?: number | Media | null;
  header_logo?: number | Media | null;
  updatedAt?: string | null;
  createdAt?: string | null;
}

export type EmployeeWhistleBlowerV2WithoutId = Omit<
  EmployeeWhistleBlowerV2Type,
  "id" | "updatedAt" | "createdAt"
>;
