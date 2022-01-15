import * as dotenv from 'dotenv';
import axios from 'axios';
import { putItem } from '../db';
import { DbHumidity } from '../models/tables/db-humidity';
import { DbTemperature } from '../models/tables/db-temperature';
import { DbTables } from '../models/tables/db-tables';
import { SpecialDevices } from '../models/common/special-devices';

dotenv.config();


export async function handler(event: any) {
    const lat = process.env.LATITUDE;
    const lon = process.env.LONGITUDE;
    const key = process.env.OPEN_WEATHER_MAP_API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`;
    try {
        const response = await axios.get(apiUrl);
        if (response.status === 200) {
            const celsius = response.data?.main?.temp;
            const humidity = response.data?.main?.humidity;
            if (celsius !== undefined) {
                await putItem<DbTemperature>(DbTables.Temperature, {
                    deviceId: SpecialDevices.Outside,
                    timestamp: Date.now(),
                    celsius,
                });
            }
            if (humidity !== undefined) {
                await putItem<DbHumidity>(DbTables.Humidity, {
                    deviceId: SpecialDevices.Outside,
                    timestamp: Date.now(),
                    humidity,
                });
            }
        }
    } catch (e) {
        console.error('Failed to get data from Open Weather Map API');
        console.error(e);
    }
}
