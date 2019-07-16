import { expect, haveResource } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';
import { MyStack } from '../bin/cdk';

test('Create a RestApi', (): void => {
  const stack = myStack();
  expect(stack).to(haveResource('AWS::ApiGateway::RestApi'));
});

test('Creates a DynamoDB Table with the correct primary key', (): void => {
  const stack = myStack();
  expect(stack).to(
    haveResource('AWS::DynamoDB::Table', {
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S',
        },
      ],
    }),
  );
});

function myStack(): MyStack {
  return new MyStack(new App(), 'testApp');
}