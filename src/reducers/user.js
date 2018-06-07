export default function user(state =
    {
        login: false,
        username: null,
        email: null,
        admin: false,
        redirectUrl: null
    }, action) {
	switch (action.type) {
		case 'LOGIN':
			return {
				...state,
                login: true,
                username: action.username,
                email: action.email,
            }
        case 'ADMINLOGIN':
            return {
                ...state,
                admin: true
            }
		case 'LOGOUT':
			return {
				...state,
                login: false,
                username: null,
                email: null,
                admin: false
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