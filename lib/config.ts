import { CloudFrontConfigProps } from "../lib/common-props";
import * as lambda from "@aws-cdk/aws-lambda";

const acmCertificateId: string = "ACM-CERTIFICATE-IN-US-EAST-1";
const team: string = "acme";

const config: CloudFrontConfigProps = {
  tags: {
    poc: "acme@acme.com",
    team: team,
    program: "acme-enterprise",
    function: "cf-distro",
  },
  distributions: [
    {
      stackName: "foo",
      domainNames: [ "foo.acme.com" ],
      acmCertificateId,
      team,
      // example with two Lambda @ Edge functions
      lambdaEdgeConfig: [
        {
          handler: "index.handler",
          runtime: lambda.Runtime.NODEJS_12_X
        },
        {
          handler: "index.handler",
          runtime: lambda.Runtime.NODEJS_12_X
        },
      ],
      // 
      // existingBucket: "pre-existing-bucket",
    },
    {
      stackName: "baz",
      domainNames: [ "baz.acme.com" ],
      acmCertificateId,
      team,
      // example with a single Lambda @ Edge function
      lambdaEdgeConfig: [
        {
          handler: "index.handler",
          runtime: lambda.Runtime.NODEJS_12_X
        },
      ],
      // 
      // existingBucket: "pre-existing-bucket",
    },
  ]
};

export default config;