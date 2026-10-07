// @ts-nocheck
import { User } from "payload/generated-types";
import { CollectionConfig } from "payload/types";
import { _getAccess, _isHidden } from "../../../helper/access";

const COLLECTION_NAME = "careers-work-type";

const CareersWorkType: CollectionConfig = {
  slug: COLLECTION_NAME,
  labels: {
    plural: "Work Types",
    singular: "Work Type",
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
      "Work Types": "Careers",
    },
  },
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
    },
  ],
};

export default CareersWorkType;
