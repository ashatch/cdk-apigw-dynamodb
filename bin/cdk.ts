#!/usr/bin/env node

import { App, Construct, Stack, RemovalPolicy } from "@aws-cdk/core";
import {
  AttributeType,
  BillingMode,
  Table,
  StreamViewType
} from "@aws-cdk/aws-dynamodb";
import {
  RestApi,
  Integration,
  IntegrationType,
  PassthroughBehavior,
  Resource
} from "@aws-cdk/aws-apigateway";
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect
} from "@aws-cdk/aws-iam";

export class MyStack extends Stack {
  public constructor(scope: Construct, id: string) {
    super(scope, id);

    const tableName = "cdk-apigw-demo";
    const apiName = "cdk-apigw-dynamodb-api";

    const tableProperties = this.createTableProperties(tableName);
    const table = new Table(this, id, tableProperties);
    this.createRestApi(apiName, table);
  }

  private createRestApi(apiName: string, table: Table) {
    const api = new RestApi(this, apiName);
    const item = api.root.addResource("items");
    const itemById = item.addResource("{id}");

    const role = this.createDynamoDBFromApiGwRole(table.tableArn);

    this.createPostItemEndpoint(itemById, table, role);
    this.createGetItemEndpoint(itemById, table, role);
  }

  private createPostItemEndpoint(itemById: Resource, table: Table, role: Role) {
    const dynamoDBRequestTemplate = JSON.stringify({
      TableName: table.tableName,
      Item: { id: { S: "$input.params('id')" } }
    });

    const emptySuccessfulJson = {
      statusCode: "200",
      responseTemplates: {
        "application/json": ""
      }
    };

    const integration = new Integration({
      type: IntegrationType.AWS,
      uri: "arn:aws:apigateway:eu-west-1:dynamodb:action/PutItem",
      integrationHttpMethod: "POST",
      options: {
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": dynamoDBRequestTemplate
        },
        integrationResponses: [emptySuccessfulJson],
        credentialsRole: role
      }
    });

    

    const methodOptions = {
      methodResponses: [
        {
          statusCode: "200",
          responseModels: { "application/json": { modelId: "Empty" } }
        }
      ]
    };

    itemById.addMethod("POST", integration, methodOptions);
  }

  private createGetItemEndpoint(itemById: Resource, table: Table, role: Role) {
    const dynamoDBRequestTemplate = JSON.stringify({
      TableName: table.tableName,
      KeyConditionExpression: "id = :v1",
      ExpressionAttributeValues: {
        ":v1": {
            "S": "$input.params('id')"
        }
    }
    });


    const responseTemplate = `
    #set($inputRoot = $input.path('$'))
    {
        "items": [
            #foreach($elem in $inputRoot.Items) {
                "id": "$elem.id.S"
            }#if($foreach.hasNext),#end
            #end
        ]
    }`

    const itemJson = {
      statusCode: "200",
      responseTemplates: {
        "application/json": responseTemplate
      }
    };

    const integration = new Integration({
      type: IntegrationType.AWS,
      uri: "arn:aws:apigateway:eu-west-1:dynamodb:action/Query",
      integrationHttpMethod: "POST",
      options: {
        passthroughBehavior: PassthroughBehavior.NEVER,
        requestTemplates: {
          "application/json": dynamoDBRequestTemplate
        },
        integrationResponses: [itemJson],
        credentialsRole: role
      }
    });

    const methodOptions = {
      methodResponses: [
        {
          statusCode: "200",
          responseModels: { "application/json": { modelId: "Empty" } }
        }
      ]
    };

    itemById.addMethod("GET", integration, methodOptions);
  }

  private createTableProperties(tableName: string) {
    return {
      tableName,
      partitionKey: {
        name: "id",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY
    };
  }

  private createDynamoDBFromApiGwRole(tableArn: string): Role {
    const role = new Role(this, "apiGatewayDynamoDBAccess",
      {
        assumedBy: new ServicePrincipal("apigateway.amazonaws.com")
      }
    );

    role.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ],
        resources: [tableArn]
      })
    );

    return role;
  }
}

const app = new App();

new MyStack(app, "cdk-apigw-dynamodb");
