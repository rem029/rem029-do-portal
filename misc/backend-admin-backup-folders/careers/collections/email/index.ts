// @ts-nocheck
import { GlobalConfig } from "payload/types";
import { User } from "payload/generated-types";
import { _getAccess, _isHidden } from "../../../../helper/access";
import EmailSettingsTest from "./test";

const COLLECTION_NAME = "careers-email-settings";

const CareersEmailSettings: GlobalConfig = {
  slug: COLLECTION_NAME,
  label: "Email Settings",
  access: {
    read: async ({ req }) =>
      await _getAccess(req, "read", undefined, COLLECTION_NAME),
    update: async ({ req }) =>
      await _getAccess(req, "update", undefined, COLLECTION_NAME),
    readVersions: async ({ req }) =>
      await _getAccess(req, "read", undefined, COLLECTION_NAME),
  },
  admin: {
    hidden: ({ user }) => {
      return _isHidden(user as unknown as User, COLLECTION_NAME);
    },
    group: {
      "Email Settings": "Careers",
    },
  },
  fields: [
    {
      type: "text",
      name: "email",
      label: "Email",
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
    },
    {
      type: "text",
      name: "password",
      label: "Password",
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
    },
    {
      type: "text",
      name: "host",
      label: "Host",
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
    },
    {
      type: "text",
      name: "port",
      label: "Port",
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
    },
    {
      type: "array",
      name: "recipients",
      label: "Recipients",
      admin: {
        description: "Email recipient for new applications",
      },
      fields: [
        { type: "text", name: "key", label: "Key" },
        { type: "text", name: "email", label: "Email" },
      ],
      access: {
        update: async ({ req }) =>
          await _getAccess(req, "update", undefined, COLLECTION_NAME),
      },
    },
    {
      name: "email_settings_test",
      label: "Test Settings",
      type: "ui",
      admin: {
        components: {
          Field: EmailSettingsTest,
        },
      },
    },
  ],
};

export default CareersEmailSettings;
