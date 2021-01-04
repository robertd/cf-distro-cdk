import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');

export class PermissionsBoundary implements cdk.IAspect {
  private readonly permissionsBoundaryArn: string;

  constructor(permissionBoundaryArn: string) {
    this.permissionsBoundaryArn = permissionBoundaryArn;
  }

  // Initial permissions boundary workaround introduced in https://github.com/aws/aws-cdk/issues/3242#issuecomment-509530635
  // This workaround doesn't work in all cases as mentioned in https://github.com/aws/aws-cdk/issues/3242#issuecomment-561064190,
  // and it doesn't with Lambda Edge here either.

  // public visit(node: cdk.IConstruct): void {
  //   if (node instanceof iam.Role) {
  //     console.log(`------PERMISSION BOUNDARY APPLIED to ${node.node.uniqueId}-------`);
  //     const roleResource = node.node.findChild('Resource') as iam.CfnRole;
  //     roleResource.addPropertyOverride('PermissionsBoundary', this.permissionsBoundaryArn);
  //   }
  // }

  // Alternate workaround mentioned in https://github.com/aws/aws-cdk/issues/3242#issuecomment-561064190
  // This workaround only applies Permissions Boundary to the main stack(s) but not in the `edge-lambda-stack-ORIGIN-REGION` stack.
  
  public visit(node: cdk.IConstruct): void {
    if (cdk.CfnResource.isCfnResource(node) && node.cfnResourceType === 'AWS::IAM::Role') {
      console.log(`------PERMISSION BOUNDARY APPLIED to ${node.node.uniqueId}-------`);
      node.addPropertyOverride('PermissionsBoundary', this.permissionsBoundaryArn);
    }
  }
}