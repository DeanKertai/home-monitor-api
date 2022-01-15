/**
 * Database helper functions
 */

import {
    DynamoDBClient,
    GetItemCommand,
    GetItemCommandInput,
    QueryCommandInput,
    QueryCommand,
    PutItemCommandInput,
    PutItemCommand,
    DeleteItemCommandInput,
    DeleteItemCommand,
    ScanCommandInput,
    ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { convertToAttr, marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ApiError } from './errors';
import * as dotenv from 'dotenv';

dotenv.config();
const client = new DynamoDBClient({ region: 'us-east-1' });


/**
 * Gets the full table name, including the stage.
 * For example, getTableName('accounts') => 'appname-prod-accounts'
 */
export function getTableName(name: string): string {
    if (!process.env.APP_NAME) {
        throw new Error('Missing environment variable APP_NAME');
    }
    return `${process.env.APP_NAME}-${process.env.STAGE}-${name}`;
}


/**
 * Get a single item from the database
 */
export async function getItem<T>(
    tableName: string,
    keyName: string,
    keyValue: string | number,
    sortName?: string,
    sortValue?: string | number,
): Promise<T | undefined> {

    const params: GetItemCommandInput = {
        TableName: getTableName(tableName),
        Key: {},
    };
    params.Key![keyName] = convertToAttr(keyValue);
    if (sortName && sortValue) {
        params.Key![sortName] = convertToAttr(sortValue);
    }
    console.log('Getting item from database with these params:');
    console.log(JSON.stringify(params));
    const command = new GetItemCommand(params);
    const result = await client.send(command);

    if (result.Item) {
        return unmarshall(result.Item) as T;
    } else {
        console.log('DB returned no results');
        return undefined;
    }
}


/**
 * Get all of the items for a partition key
 */
export async function getAll<T>(
    tableName: string,
    keyName: string,
    keyValue: string | number,
): Promise<T[] | undefined> {
    const params: QueryCommandInput = {
        TableName : getTableName(tableName),
        KeyConditionExpression: '#keyName = :keyValue',
        ExpressionAttributeNames:{
            '#keyName': keyName
        },
        ExpressionAttributeValues: {
            ':keyValue': convertToAttr(keyValue)
        },
    };
    console.log('Getting items from database with these params:');
    console.log(JSON.stringify(params));
    const command = new QueryCommand(params);
    const result = await client.send(command);
    if (result.Items) {
        console.log(`DB returned ${result.Items?.length || 0} items`);
        return result.Items.map(item => unmarshall(item) as T);
    }
    return undefined;
}


/**
 * Scan a table
 */
 export async function scanTable<T>(
    tableName: string,
    limit: number,
): Promise<T[] | undefined> {
    const params: ScanCommandInput = {
        TableName : getTableName(tableName),
        ReturnConsumedCapacity: 'TOTAL',
        Limit: limit,
    };
    console.log('Scanning items from database with these params:');
    console.log(JSON.stringify(params));
    const command = new ScanCommand(params);
    const result = await client.send(command);
    console.log('Consumed capacity:');
    console.log(JSON.stringify(result.ConsumedCapacity));

    if (result.Items) {
        console.log(`DB returned ${result.Items?.length || 0} items`);
        return result.Items.map(item => unmarshall(item) as T);
    }
    return undefined;
}


/**
 * Get all items from a table with the given GSI key/value
 */
export async function getUsingGSI<T>(
    tableName: string,
    indexName: string,
    indexKey: string,
    indexValue: string,
): Promise<T[] | undefined> {

    // Sanity check: Make sure the index valid is defined
    if (indexValue === undefined) {
        console.error('getUsingGSI fail: indexValue is undefined')
        throw new ApiError(500);
    }
    
    const params: QueryCommandInput = {
        TableName : getTableName(tableName),
        IndexName: indexName,
        KeyConditionExpression: '#keyName = :keyValue',
        ExpressionAttributeNames:{
            '#keyName': indexKey
        },
        ExpressionAttributeValues: {
            ':keyValue': convertToAttr(indexValue)
        },
        ReturnConsumedCapacity: 'TOTAL',
    };
    console.log('Getting items from database by GSI with these params:');
    console.log(JSON.stringify(params));
    const command = new QueryCommand(params);
    const result = await client.send(command);
    if (result.Items) {
        console.log(`DB returned ${result.Items?.length || 0} items`);
        return result.Items.map(item => unmarshall(item) as T);
    }
    console.log(JSON.stringify(result.ConsumedCapacity));
    return undefined;
}


/**
 * Put item in the database
 */
export async function putItem<T>(tableName: string, item: T): Promise<void> {
    const params: PutItemCommandInput = {
        TableName : getTableName(tableName),
        Item: marshall(item, { removeUndefinedValues: true }),
        ReturnConsumedCapacity: 'TOTAL',
    };
    const command = new PutItemCommand(params);
    const result = await client.send(command);
    console.log(`Put an item in table ${params.TableName}`);
    console.log(JSON.stringify(result.ConsumedCapacity));
}



/**
 * Delete a single item from the database
 */
export async function deleteItem(
    tableName: string,
    keyName: string,
    keyValue: string | number,
    sortName?: string | number,
    sortValue?: string | number,
): Promise<void> {
    const params: DeleteItemCommandInput = {
        Key: {},
        TableName: getTableName(tableName),
    };
    params.Key![keyName] = convertToAttr(keyValue);
    if (sortName && sortValue) {
        params.Key![sortName] = convertToAttr(sortValue);
    }
    console.log('Deleting item from database:');
    console.log(JSON.stringify(params));
    const command = new DeleteItemCommand(params);
    await client.send(command);
}
