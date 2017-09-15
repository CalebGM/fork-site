export const login = () => {
	return {
		type: 'LOGIN'
	}
}

export const logout = () => {
	return {
		type: 'LOGOUT'
	}
}

export const setRedirectUrl = (url) => {
	return {
		type: 'REDIRECT',
		redirectUrl: url
	}
}

export const nullRedirect = () => {
	return {
		type: 'REDIRECTED'
	}
}