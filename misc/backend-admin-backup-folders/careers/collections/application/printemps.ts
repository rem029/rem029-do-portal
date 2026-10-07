// @ts-nocheck
import { CollectionConfig } from "payload/types";
import { _getAccess, _isHidden } from "../../../../helper/access";
import CareersApplication from "./index";
import {
  CareersApplicationPrintemp,
  CareersEmailSetting,
  CareersPrintemp,
  User,
} from "payload/generated-types";
import axios from "axios";

const COLLECTION_NAME = "careers-application-printemps";
const COLLECTION_NAME_CAREERS = "careers-printemps";
const OPERATOR = { label: "Printemps", key: "printemps" };

const CareersApplicationPrintemps: CollectionConfig = {
  ...CareersApplication,
  slug: COLLECTION_NAME,
  labels: {
    plural: "Printemps Applications",
    singular: "Printemps Application",
  },
  admin: {
    ...CareersApplication.admin,
    useAsTitle: "email",
    hidden: ({ user }) => {
      return _isHidden(user as unknown as User, COLLECTION_NAME);
    },
    group: {
      "Applications Printemps": "Careers",
    },
    listSearchableFields: [
      ...CareersApplication.admin.listSearchableFields,
      "career.title",
      "career_questions.item.title",
      "career_questions.response",
    ],
    defaultColumns: [...CareersApplication.admin.defaultColumns],
  },
  hooks: {
    ...CareersApplication.hooks,
    afterChange: [
      async ({ doc, operation, req, collection }) => {
        const { serverURL, routes } = req.payload.config;

        if (operation === "create") {
          const { recipients }: CareersEmailSetting = await req.payload.findGlobal({
            slug: "careers-email-settings",
          });
          const careerApplicant: CareersApplicationPrintemp = doc;
          const career: CareersPrintemp = careerApplicant.career as CareersPrintemp;
          const careerRecipients = recipients
            ? recipients.filter((r) => r.key === OPERATOR.key).map((r) => r.email)
            : [];

          axios({
            method: "post",
            url: `${serverURL}${routes.api}/email/send/v2/careers`,
            data: {
              title: `Your application has been received for ${career.title}`,
              to: careerApplicant.email,
              args: {
                operator: OPERATOR.label,
                careerTitle: career.title,
                template: "email-careers-applicant",
              },
            },
          });

          axios({
            method: "post",
            url: `${serverURL}${routes.api}/email/send/v2/careers`,
            data: {
              title: `New Application received for ${career.title}`,
              to: careerRecipients,
              args: {
                url: `${serverURL}${routes.admin}/collections/careers-application-printemps/${careerApplicant.id}`,
                careerTitle: career.title,
                template: "email-careers-new",
              },
            },
          });
        }
      },
    ],
  },
  fields: [
    ...CareersApplication.fields,
    {
      name: "career",
      label: "Applying for",
      type: "relationship",
      relationTo: COLLECTION_NAME_CAREERS,
      required: true,
    },
    {
      name: "career_questions",
      label: "Question",
      labels: {
        plural: "Questions",
        singular: "Question",
      },
      type: "array",
      fields: [
        {
          name: "item",
          label: "Item",
          type: "relationship",
          relationTo: "careers-questions",
        },
        { name: "response", label: "Response", type: "text" },
      ],
    },
  ],
};

export default CareersApplicationPrintemps;
