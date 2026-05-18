import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";

import { authKeys } from "@/api/auth/queries";
import { login, logout } from "@/api/auth/requests";
import type {
	AuthUser,
	LoginRequest,
	LoginResponse,
	LogoutResponse,
} from "@/api/auth/types";

export const authMutations = {
	login: () =>
		mutationOptions<LoginResponse, Error, LoginRequest>({
			mutationKey: [...authKeys.all, "login"],
			mutationFn: login,
		}),
	logout: () =>
		mutationOptions<LogoutResponse, Error, void>({
			mutationKey: [...authKeys.all, "logout"],
			mutationFn: logout,
		}),
};

export function useLoginMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...authMutations.login(),
		onSuccess: (user) => {
			queryClient.setQueryData<AuthUser>(authKeys.currentUser(), user);
		},
	});
}

export function useLogoutMutation() {
	const queryClient = useQueryClient();

	return useMutation({
		...authMutations.logout(),
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: authKeys.all });
		},
	});
}
