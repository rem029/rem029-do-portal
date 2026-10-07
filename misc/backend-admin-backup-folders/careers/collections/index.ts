// @ts-nocheck
import { User } from "payload/generated-types";
import { CollectionConfig } from "payload/types";
import { _getAccess, _isHidden } from "../../../helper/access";
import { uuid } from "uuidv4";
import CareersId from "../../../components/careers-id";

const COLLECTION_NAME = "careers";

const Careers: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: "Careers",
    singular: "Careers",
  },
  access: {
    read: async ({ req }) => await _getAccess(req, "read"),
    create: async ({ req }) => await _getAccess(req, "create"),
    update: async ({ req }) => await _getAccess(req, "update"),
    admin: async ({ req }) => await _getAccess(req, "admin"),
    delete: async ({ req }) => await _getAccess(req, "delete"),
  },
  timestamps: true,
  admin: {
    useAsTitle: "title",
    hidden: ({ user }) => {
      return _isHidden(user as unknown as User, COLLECTION_NAME);
    },
    group: {
      Careers: "Careers",
    },
    listSearchableFields: [
      "title",
      "id",
      "department.name",
      "work_type.title",
      "responsibilities.title",
      "responsibilities.sub_title",
      "qualifications.title",
      "qualifications.sub_title",
      "questions.careers_questions.title",
    ],
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data?.id) {
          const customID = uuid();
          return { ...data, id: customID };
        }
        return data;
      },
    ],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "id",
      type: "text",
      admin: {
        components: {
          Field: CareersId,
        },
      },
    },
    {
      name: "code",
      label: "Code",
      type: "text",
      admin: {
        description:
          "If job code is not provided, default ID will be displayed as a job reference.",
      },
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },
    {
      name: "department",
      label: "Department",
      type: "relationship",
      relationTo: "department",
      required: true,
    },
    {
      name: "work_type",
      label: "Work Type",
      type: "relationship",
      relationTo: "careers-work-type",
      required: true,
    },
    {
      name: "active",
      label: "Is position active?",
      type: "checkbox",
      admin: {
        hidden: true,
      },
    },
    {
      name: "expires_at",
      label: "Expires at?",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" }, hidden: true },
    },
    {
      name: "responsibilities",
      label: "Responsibilities",
      type: "array",
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
        },
        {
          name: "sub_title",
          label: "Sub Title",
          type: "text",
        },
      ],
    },
    {
      name: "qualifications",
      label: "Qualifications",
      type: "array",
      fields: [
        {
          name: "title",
          label: "Title",
          type: "text",
        },
        {
          name: "sub_title",
          label: "Sub Title",
          type: "text",
        },
      ],
    },
    {
      name: "questions",
      label: "Questions",
      type: "array",
      fields: [
        {
          name: "careers_questions",
          label: "Question",
          type: "relationship",
          relationTo: "careers-questions",
        },
        {
          name: "required",
          label: "Is Question Required?",
          type: "checkbox",
        },
      ],
    },
  ],
};

export default Careers;
