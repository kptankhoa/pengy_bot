export interface Weather {
    location: {
        name: string;
        lat: string;
        long: string;
        timezone: string;
        alert: string;
        degreetype: "C" | "F";
        imagerelativeurl: string;
    };
    current: {
        temperature: string;
        skycode: string;
        skytext: string;
        date: string;
        observationtime: string;
        observationpoint: string;
        feelslike: string;
        humidity: string;
        winddisplay: string;
        day: string;
        shortday: string;
        windspeed: string;
        imageUrl: string;
    };
    forecast: {
        low: string;
        high: string;
        skycodeday: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
        precip: string;
    }[];
}

export interface SimplifiedWeather {
    location: {
        name: string;
        timezone: string;
        alert: string;
        degreetype: "C" | "F";
    };
    current: {
        temperature: string;
        skytext: string;
        date: string;
        observationtime: string;
        observationpoint: string;
        feelslike: string;
        humidity: string;
        winddisplay: string;
        day: string;
        shortday: string;
        windspeed: string;
    };
    forecast: {
        low: string;
        high: string;
        skytextday: string;
        date: string;
        day: string;
        shortday: string;
    }[];
}