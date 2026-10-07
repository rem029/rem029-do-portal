// @ts-nocheck
import { User } from "payload/generated-types";
import { CollectionConfig } from "payload/types";
import { _getAccess, _isHidden } from "../../../../helper/access";
import { uuid } from "uuidv4";
import CareersId from "../../../../components/careers-id";

const COLLECTION_NAME = "careers-application";

const CareersApplication: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: "Applications",
    singular: "Application",
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
      Applications: "Careers",
    },
    listSearchableFields: [
      "id",
      "first_name",
      "last_name",
      "phone",
      "email",
      "cover_letter",
    ],
    defaultColumns: ["first_name", "last_name", "phone", "email", "cover_letter"],
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
      name: "first_name",
      label: "First Name",
      type: "text",
      required: true,
    },
    {
      name: "last_name",
      label: "Last Name",
      type: "text",
      required: true,
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      required: true,
    },
    {
      name: "nationality",
      label: "Nationality",
      type: "text",
      required: true,
    },
    {
      name: "country_of_residence",
      label: "Country of residence",
      type: "text",
      required: true,
    },
    {
      name: "nationalIdPassportNumber",
      label: "National ID or Passport#",
      type: "text",
      required: true,
    },
    {
      name: "cover_letter",
      label: "Cover Letter",
      type: "textarea",
      required: true,
    },
    {
      name: "resume",
      label: "Resume",
      type: "relationship",
      relationTo: "careers-media",
      required: true,
    },
  ],
};

export default CareersApplication;
