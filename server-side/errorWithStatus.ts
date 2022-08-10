export class ErrorWithStatus extends Error 
{
	public code: number;
	constructor(error: unknown) 
	{
		if(error instanceof Error) 
		{
			super(error.message);
			this.code = this.parseStatusCode()
		}
		else
		{
			throw error;
		}
	}

	/**
	 * Pareses the status code from the error object.
	 * @param error The error to parse the status code from
	 * @returns a number representing the status code
	 */
	parseStatusCode(): number
	{
		// papi-sdk returns a string with the status code
		// error messages look like:
		// throw new Error(`${fullURL} failed with status: ${res.status} - ${res.statusText} error: ${error}`);

		const substring = 'failed with status: ';
		const index = this.message.indexOf(substring);
		if(index !== -1)
		{
			const statusCode = this.message.substring(index + substring.length, index + substring.length + 3);
			return parseInt(statusCode);
		}
		else
		{
			return 500;
		}
	}
}
