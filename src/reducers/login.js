const login = (state = { login: false, redirectUrl: null }, action) => {
	switch (action.type) {
		case 'LOGIN':
			return {
				...state,
				login: true 
			}
		case 'LOGOUT':
			return {
				...state,
				login: false
			}
		case 'REDIRECT':
			return {
				...state,
				redirectUrl: action.redirectUrl
			}
		case 'REDIRECTED':
			return {
				...state,
				redirectUrl: null
			}
		default:
			return state
	}
}

export default login