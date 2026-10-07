// @ts-nocheck
import { User } from "payload/generated-types";
import { CollectionConfig, Where } from "payload/types";
import { _getAccess, _isHidden } from "../../../helper/access";
import Careers from "./index";

const COLLECTION_NAME = "careers-printemps";

const CareersPrintemps: CollectionConfig = {
  ...Careers,
  slug: COLLECTION_NAME,
  labels: {
    ...Careers.labels,
    plural: "Printemps Careers Jobs",
    singular: "Printemps Career Job",
  },
  admin: {
    ...Careers.admin,
    useAsTitle: "title",
    hidden: ({ user }) => {
      return _isHidden(user as unknown as User, COLLECTION_NAME);
    },
    group: {
      "Job Printemps": "Careers",
    },
  },
  endpoints: [
    {
      path: "/search/:keyword",
      method: "get",
      handler: async (req, res, next) => {
        const { limit, page, sort } = req.query;
        let { keyword } = req.params;
        let { department } = req.query;

        keyword = keyword ? `%${keyword}%` : `%%`;
        department = department ? `%${department}%` : `%%`;

        const fields = ["title", "description"];
        const fieldsOrQuery = fields.map((field) => ({
          [field]: {
            like: `${keyword}`,
          },
        }));

        const fieldsQuery: Where = {
          _status: {
            equals: "published",
          },
          ...(department && {
            "department.name": { like: department },
          }),
          or: fieldsOrQuery,
        };

        try {
          const response = await req.payload.find({
            collection: COLLECTION_NAME,
            where: fieldsQuery,
            limit: Number(limit),
            page: Number(page),
            sort: sort as string,
          });

          res.status(200).send({ ...response });
        } catch (error) {
          next(error);
        }
      },
    },
  ],
};

export default CareersPrintemps;
