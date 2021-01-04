import { Runtime } from "@aws-cdk/aws-lambda";

export interface CloudFrontConfigProps {
  /**
   * Mandatory tags
   */
  tags: Tags;
  
  /**
   * CloudFrontDistribution config
   */
  distributions: CloudFrontDistributionConfig[];
}

export interface Tags {
  /**
   * Point of contact email
   */

  poc: string;

  /**
   * Team tag
   */
  team: string;

  /**
   * Function tag
   */
  function: string;

  /**
   * Program tag
   */
  program: string;
}

export interface CloudFrontDistributionConfig {
  /**
   * Name of the stack
   */
  stackName: string;

  /**
   * Custom origin path for API Gateway stage name
   */
  originPath?: string;

  /**
   * Existing s3 bucket
   */
  existingBucket?: string;

  /**
   * Domain URLs
   */
  domainNames: string[];

  /**
   * Team tag
   */
  team: string;

  /**
   * ACM Certificate ID
   */
  acmCertificateId: string;

  /**
   * Lambda config
   */
  lambdaEdgeConfig?: LambdaEdgeConfig[];
}

interface LambdaEdgeConfig {
  /**
   * Lambda handler
   */
  handler: string;

  /**
   * Lambda @ Edge Runtime
   */
  runtime: Runtime;
}
