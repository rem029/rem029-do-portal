// @ts-nocheck
import { GlobalConfig } from "payload/types";
import CareersContents from "./index";
import { User } from "payload/generated-types";
import { _getAccess, _isHidden } from "../../../../helper/access";

const COLLECTION_NAME = "careers-content-printemps";

const CareersContentPrintemps: GlobalConfig = {
  ...CareersContents,
  slug: COLLECTION_NAME,
  label: "Printemps Contents",
  admin: {
    ...CareersContents.admin,
    hidden: ({ user }) => {
      return _isHidden(user as unknown as User, COLLECTION_NAME);
    },
    group: {
      "Contents Printemps": "Careers",
    },
  },
  fields: [
    ...CareersContents.fields,
    {
      name: "careers",
      label: "Careers",
      type: "group",
      admin: {
        description: "Displayed on careers home page",
      },
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
      fields: [
        {
          name: "logo",
          label: "Logo",
          type: "relationship",
          relationTo: "media",
        },
        {
          name: "title",
          label: "Title",
          type: "text",
          access: {
            update: async ({ req }) =>
              await _getAccess(req, "update", undefined, COLLECTION_NAME),
          },
        },
        {
          name: "sub_title",
          label: "Sub Title",
          type: "textarea",
          access: {
            update: async ({ req }) =>
              await _getAccess(req, "update", undefined, COLLECTION_NAME),
          },
        },
      ],
    },
    {
      name: "about_us",
      label: "About us",
      admin: {
        description: "Displayed once user clicked on posted jobs",
      },
      type: "group",
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
      fields: [
        {
          name: "logo",
          label: "Logo",
          type: "relationship",
          relationTo: "media",
        },
        {
          name: "title",
          label: "Title",
          type: "text",
          access: {
            update: async ({ req }) =>
              await _getAccess(req, "update", undefined, COLLECTION_NAME),
          },
        },
        {
          name: "sub_title",
          label: "Sub Title",
          type: "textarea",
          access: {
            update: async ({ req }) =>
              await _getAccess(req, "update", undefined, COLLECTION_NAME),
          },
        },
      ],
    },
  ],
};

export default CareersContentPrintemps;
