#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CloudfrontStack } from '../lib/cloudfront-stack';
import { PermissionsBoundary } from '../overrides/permissions-boundary';
import { Tags } from '../lib/common-props';
import config from "../lib/config";

interface Env {
  account: string;
  region: string;
}

const env: Env = {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? cdk.Aws.ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION ?? cdk.Aws.REGION,
};

const app = new cdk.App();

const tags: Tags = {
  poc: config.tags.poc,
  function: config.tags.function,
  program: config.tags.program,
  team: config.tags.team,
};

config.distributions.forEach(distroConfig => {
  let stack = new CloudfrontStack(app, `${distroConfig.team}-${distroConfig.stackName}CFStack`, {
    distroConfig,
    env,
    description: `CloudFront distro stack for ${distroConfig.stackName}`,
  });
  
  cdk.Aspects.of(stack).add(new PermissionsBoundary(`arn:aws:iam::${env.account}:policy/csr-Developer-Permissions-Boundary`));
  cdk.Aspects.of(stack).add(new cdk.Tag("poc", tags.poc));
  cdk.Aspects.of(stack).add(new cdk.Tag("team", tags.team));
  cdk.Aspects.of(stack).add(new cdk.Tag("program", tags.program));
  cdk.Aspects.of(stack).add(new cdk.Tag("function", `${distroConfig.team}-${distroConfig.stackName}-${tags.function}`));
});
