# cdk-apigw-dynamodb

## Purpose 
Tech demonstrator for how to use [AWS Cloud Development Kit (CDK)](https://github.com/aws/aws-cdk)
to proxy AWS DynamoDB with AWS API Gateway.

## What it does

* Creates an AWS DynamoDB table
* Creates an API Gateway
* Maps a POST endpoint to proxy a PutItems request

> Note: the DynamoDB table is set to teardown with the stack

## Why

Andrew Baird has an article:
[Using Amazon API Gateway as a proxy for DynamoDB](https://aws.amazon.com/blogs/compute/using-amazon-api-gateway-as-a-proxy-for-dynamodb/). This is an example of how to use
CDK to achieve some of the ideas explained in the article.

## Howto

```shell
npm install -g cdk
npm install
npm run build
cdk deploy
```

## Also

There are a couple of noddy tests to run too:

```shell
npm run test
```
