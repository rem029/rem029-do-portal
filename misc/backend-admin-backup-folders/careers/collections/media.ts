import { User } from "payload/generated-types";
import { CollectionConfig } from "payload/types";
import { _getAccess, _isHidden } from "../../../helper/access";

const COLLECTION_NAME = "careers-media";

const CareersMedia: CollectionConfig = {
  slug: COLLECTION_NAME,
  upload: {
    staticURL: `/payload/${COLLECTION_NAME}/`,
    staticDir: COLLECTION_NAME,
    adminThumbnail: ({ doc }) => `${doc.filename}`,
  },
  access: {
    read: async ({ req }) => await _getAccess(req, "read"),
    create: async ({ req }) => await _getAccess(req, "create"),
    update: async ({ req }) => await _getAccess(req, "update"),
    admin: async ({ req }) => await _getAccess(req, "admin"),
    delete: async ({ req }) => await _getAccess(req, "delete"),
  },
  admin: {
    hidden: ({ user }) => {
      return _isHidden(user as unknown as User, COLLECTION_NAME);
    },
    group: {
      Media: "Careers",
    },
  },
  timestamps: true,
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
};

export default CareersMedia;
