import process from 'node:process';

type PlainObject = Record<string, unknown>;

export enum Environment {
	Development = 'development',
	Staging = 'staging',
	Production = 'production',
	Test = 'test',
}

export enum LogLevel {
	Trace = 0,
	Debug = 1,
	Info = 2,
	Warn = 3,
	Error = 4,
}

export enum LogLevelName {
	Trace = 'trace',
	Debug = 'debug',
	Info = 'info',
	Warn = 'warn',
	Error = 'error',
}

export enum LogFormat {
	Inspect = 0,
	JSON = 1,
}

const logLevels: readonly string[] = ['trace', 'debug', 'info', 'warn', 'error'] as const;
const ecsVersion = '1.6.0';

type LoggerType = {
	debug(...data: unknown[]): void;
	error(...data: unknown[]): void;
	info(...data: unknown[]): void;
	log(level: LogLevel, ...data: unknown[]): void;
	trace(...data: unknown[]): void;
	warn(...data: unknown[]): void;
};

abstract class AbstractLogger implements LoggerType {
	public debug(...data: unknown[]): void {
		this.log(LogLevel.Debug, ...data);
	}

	public error(...data: unknown[]): void {
		this.log(LogLevel.Error, ...data);
	}

	public info(...data: unknown[]): void {
		this.log(LogLevel.Info, ...data);
	}

	public trace(...data: unknown[]): void {
		this.log(LogLevel.Trace, ...data);
	}

	public warn(...data: unknown[]): void {
		this.log(LogLevel.Warn, ...data);
	}

	public abstract log(level: LogLevel, ...data: unknown[]): void;
}

type LoggerOptions = {
	logLevel: LogLevel;
	logFormat?: LogFormat;
	console?: Console;
};

export class Logger extends AbstractLogger {
	private readonly logLevel: LogLevel;
	private readonly logFormat: LogFormat;
	private readonly console: Console;

	constructor({ logLevel = LogLevel.Info, logFormat = LogFormat.JSON, console = global.console }: LoggerOptions) {
		super();
		this.logLevel = logLevel;
		this.logFormat = logFormat;
		this.console = console;
	}

	log(logLevel: LogLevel, ...data: PlainObject[]): void {
		if (logLevel < this.logLevel) {
			return;
		}

		const timestamp = new Date().toISOString().slice(11, 23);
		const formattedLogLevel = getLogLevelColour(logLevel);
		const { message, ...metadata } = serialize(merge(...data));

		switch (this.logFormat) {
			case LogFormat.Inspect:
				this.console.log(`${timestamp} ${formattedLogLevel}`, ...data);
				break;
			case LogFormat.JSON:
				this.console.log(
					JSON.stringify({
						message,
						metadata,
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'@timestamp': new Date(), // https://www.elastic.co/guide/en/ecs/current/ecs-base.html#field-timestamp
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'log.level': logLevels[logLevel], // https://www.elastic.co/guide/en/ecs/current/ecs-log.html#field-log-level
						// eslint-disable-next-line @typescript-eslint/naming-convention
						'ecs.version': ecsVersion, // https://www.elastic.co/guide/en/ecs/current/ecs-ecs.html#field-ecs-version
					})
				);
				break;
			default:
				this.console.log(`${timestamp} ${formattedLogLevel}`, ...data);
				break;
		}
	}
}

function getLogLevelColour(logLevel: LogLevel) {
	switch (logLevel) {
		case LogLevel.Trace:
			return `\u001B[35mTRACE\u001B[0m`;
		case LogLevel.Debug:
			return `\u001B[36mDEBUG\u001B[0m`;
		case LogLevel.Info:
			return `\u001B[32mINFO \u001B[0m`;
		case LogLevel.Warn:
			return `\u001B[33mWARN \u001B[0m`;
		case LogLevel.Error:
			return `\u001B[31mERROR\u001B[0m`;
		default:
			return `\u001B[32mINFO \u001B[0m`;
	}
}

function combine(...values: unknown[]) {
	return values.filter((value) => value !== undefined).join(' ');
}

function merge(...data: PlainObject[]): PlainObject {
	// eslint-disable-next-line unicorn/no-array-reduce
	return data.reduce((mergedData, data) => {
		if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
			return {
				...mergedData,
				message: combine(mergedData.message, data),
			};
		}

		if (typeof data === 'object') {
			return {
				...mergedData,
				...data,
			};
		}

		return mergedData;
	}, {});
}

export function serialize(object: PlainObject, knownRefs = new WeakSet()): PlainObject {
	// eslint-disable-next-line unicorn/no-array-reduce
	return Object.getOwnPropertyNames(object).reduce((newObject: PlainObject, propertyName) => {
		const propertyValue = object[propertyName];

		if (typeof propertyValue === 'object' && propertyValue !== null) {
			if (knownRefs.has(propertyValue)) {
				newObject[propertyName] = '[CIRCULAR]';
			} else {
				knownRefs.add(propertyValue);
				newObject[propertyName] = serialize(propertyValue as PlainObject, knownRefs);
				knownRefs.delete(propertyValue);
			}
		} else {
			newObject[propertyName] = propertyValue;
		}

		return newObject;
	}, {});
}

function isEnvironment(environment: unknown): environment is Environment {
	return (
		environment === Environment.Development ||
		environment === Environment.Staging ||
		environment === Environment.Production ||
		environment === Environment.Test
	);
}

function getEnvironment() {
	const environment: unknown = process.env.NODE_ENV;

	return isEnvironment(environment) ? environment : Environment.Production;
}

function isLogLevel(logLevelName: unknown): logLevelName is LogLevelName {
	if (typeof logLevelName !== 'string') return false;

	// todo: use enum instead of string.
	/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
	return (
		logLevelName === LogLevelName.Trace ||
		logLevelName === LogLevelName.Debug ||
		logLevelName === LogLevelName.Info ||
		logLevelName === LogLevelName.Warn ||
		logLevelName === LogLevelName.Error
	);
	/* eslint-enable @typescript-eslint/no-unsafe-enum-comparison */
}

function getLogLevel(logLevelName?: string) {
	switch (logLevelName) {
		case LogLevelName.Error:
			return LogLevel.Error;
		case LogLevelName.Warn:
			return LogLevel.Warn;
		case LogLevelName.Info:
			return LogLevel.Info;
		case LogLevelName.Debug:
			return LogLevel.Debug;
		case LogLevelName.Trace:
			return LogLevel.Trace;
		default:
			return undefined;
	}
}

function getDefaultLogLevel(environment: Environment) {
	switch (environment) {
		case Environment.Development:
			return LogLevel.Debug;
		case Environment.Staging:
		case Environment.Production:
			return LogLevel.Info;
		case Environment.Test:
			return LogLevel.Error;
		default:
			return LogLevel.Info;
	}
}

function getDefaultLogFormat(environment: Environment) {
	switch (environment) {
		case Environment.Development:
		case Environment.Test:
		case Environment.Production:
			return LogFormat.Inspect;
		case Environment.Staging:
			return LogFormat.JSON;
		default:
			return LogFormat.Inspect;
	}
}

function createLogger(logLevelName?: string, console?: Console) {
	if (logLevelName && !isLogLevel(logLevelName)) {
		throw new Error(
			`LOG_LEVEL, if set, must == error, warn, info, debug or trace, but was set to ${logLevelName}.`
		);
	}

	const environment = getEnvironment();
	const logLevel = getLogLevel(logLevelName) ?? getDefaultLogLevel(environment);
	const logFormat = getDefaultLogFormat(environment);

	return new Logger({
		logLevel,
		logFormat,
		console,
	});
}

export const logger = createLogger(process.env.LOG_LEVEL);
