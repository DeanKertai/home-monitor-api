import {
    APIGatewayProxyEventV2WithRequestContext as ApiEvent,
    APIGatewayEventRequestContextV2 as Context
} from 'aws-lambda';
import { ApiError } from './errors';
import * as JWT from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'generated.env' });


/**
 * Verifies the JWT supplied in the request event
 * Resolves with the decoded token if successful, otherwise
 * it will reject/throw with an ApiError
 */
export function verifyToken(event: ApiEvent<Context>): Promise<JWT.JwtPayload | undefined> {
    return new Promise((resolve, reject) => {
        const jwtSecret = getJWTSecret();
        const tokenString = getJWT(event);
        JWT.verify(tokenString, jwtSecret, (err, decoded) => {
            if (err) {
                console.error(`Invalid token. ${err}`);
                reject(new ApiError(401));
                return;
            } else {
                resolve(decoded);
            }
        });
    });
};


/**
* Signs and returns a token with the secret key
*/
export function signJWT(): string {
   const jwtSecret = getJWTSecret();
   return JWT.sign({}, jwtSecret, { expiresIn: '7d' });
};


/**
 * Get the JWT secret environment variable, and make sure it is set
 */
function getJWTSecret(): string {
    if (!process.env.JWT_SECRET) {
        console.error('JWT secret not set');
        throw new ApiError(500);
    }
    return process.env.JWT_SECRET;
}


/**
 * Gets the JWT supplied by the client from the headers
 */
function getJWT(event: ApiEvent<Context>): string {
    const authHeader = event.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 7) {
        return authHeader.substring(7);
    }
    console.warn('Client did not supply bearer token');
    throw new ApiError(401);
}