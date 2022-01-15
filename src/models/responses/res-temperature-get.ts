import { DbTemperature } from "../tables/db-temperature";

export interface ResponseTemperatureGet {
    from: number;
    to: number;
    deviceId: string;
    results: DbTemperature[];
}
