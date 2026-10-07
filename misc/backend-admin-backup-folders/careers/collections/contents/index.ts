// @ts-nocheck
import { GlobalConfig } from "payload/types";
import { User } from "payload/generated-types";
import { _getAccess, _isHidden } from "../../../../helper/access";

const COLLECTION_NAME = "careers-content";

const CareersContent: GlobalConfig = {
  slug: COLLECTION_NAME,
  label: "Contents",
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
      Contents: "Careers",
    },
  },
  fields: [],
};

export default CareersContent;
