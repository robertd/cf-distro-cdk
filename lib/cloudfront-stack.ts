import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as path from 'path';
import { CloudFrontDistributionConfig } from './common-props';

export interface CloudFrontProps extends cdk.StackProps {
  distroConfig: CloudFrontDistributionConfig; 
}

export class CloudfrontStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CloudFrontProps) {
    super(scope, id, props);

    const logBucket = s3.Bucket.fromBucketName(this, "logs-bucket", `csr-adminbucket-${this.account}`);
    
    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      "certificate", 
      `arn:aws:acm:us-east-1:${this.account}:certificate/${props.distroConfig.acmCertificateId}`
    );

    const bucket = props.distroConfig.existingBucket ? s3.Bucket.fromBucketName(this, "existing-bucket", props.distroConfig.existingBucket) 
      : createBucket(this, props.distroConfig.stackName, this.account, logBucket);

    const edgeLambdas = props.distroConfig.lambdaEdgeConfig ? props.distroConfig.lambdaEdgeConfig.map((config, index) => {
      const edgeLambda = new cloudfront.experimental.EdgeFunction(this, `${props.distroConfig.stackName}-lambda-edge-${index}`, {
        runtime: config.runtime,
        handler: config.handler,
        code: lambda.Code.fromAsset(path.join(__dirname, `lambda/${props.distroConfig.team}`)),
        description: `Lambda Edge function for ${props.distroConfig.stackName}`,
      });
      
      return {
        functionVersion: edgeLambda.currentVersion,
        eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
      }
    }) : undefined;

    const distro = new cloudfront.Distribution(this, "distro", {
      defaultBehavior: {
        origin: new origins.S3Origin(bucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        // cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // default: CACHING_OPTIMIZED 24hr
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas,
      },
      certificate,
      comment: `${props.distroConfig.domainNames[0]} cloudfront distribution.`,
      logBucket: logBucket,
      logFilePrefix: `AWSLogs/${this.account}/cloudfront/${props.distroConfig.team}/static/${props.distroConfig.stackName}`,
      logIncludesCookies: true,
      defaultRootObject: "index.html",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // USA & EU
      domainNames: props.distroConfig.domainNames,
    });

    new cdk.CfnOutput(this, "cfDomainName", {
      value: distro.domainName,
      exportName: `${props.distroConfig.stackName}-domainName`,
      description: `Domain name for ${props.distroConfig.stackName} cloudfront distribution.`,
    });
  }
}

function createBucket(construct: cdk.Construct, stackName: string, account: any, logBucket: s3.IBucket): s3.Bucket {
  const bucketName = `${stackName}-static-${account}`;
  const bucket = new s3.Bucket(construct, `${stackName}-bucket`, {
    bucketName,
    encryption: s3.BucketEncryption.S3_MANAGED,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    serverAccessLogsBucket: logBucket,
    serverAccessLogsPrefix: `AWSLogs/${account}/s3/${bucketName}/`,
    // versioned: true,
  });

  applySecureBucketPolicy(bucket);

  return bucket;
}

function applySecureBucketPolicy(s3Bucket: s3.Bucket): void {
  // Apply bucket policy to enforce encryption of data in transit
  s3Bucket.addToResourcePolicy(
    new iam.PolicyStatement({
      sid: 'HttpsOnly',
      resources: [
        `${s3Bucket.bucketArn}/*`
      ],
      actions: ['*'],
      principals: [new iam.AnyPrincipal()],
      effect: iam.Effect.DENY,
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false'
        }
      }
    })
  );
}