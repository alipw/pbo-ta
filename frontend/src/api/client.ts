const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly response: Response,
	) {
		super(message);
		this.name = "ApiError";
	}
}

type ApiRequestOptions<TRequest> = Omit<RequestInit, "body"> & {
	body?: TRequest;
};

export async function apiRequest<TResponse, TRequest = never>(
	path: string,
	options: ApiRequestOptions<TRequest> = {},
): Promise<TResponse> {
	const { body, headers, ...init } = options;

	const response = await fetch(`${API_BASE_URL}${path}`, {
		credentials: "include",
		...init,
		headers: {
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
			...headers,
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	if (!response.ok) {
		throw new ApiError(response.statusText, response.status, response);
	}

	if (response.status === 204) {
		return undefined as TResponse;
	}

	const text = await response.text();

	if (!text) {
		return undefined as TResponse;
	}

	return JSON.parse(text) as TResponse;
}
