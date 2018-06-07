export const login = (username, email) => {
	return {
        type: 'LOGIN',
        username: username,
        email: email
	}
}

export const adminLogin = () => {
    return {
        type: 'ADMINLOGIN'
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


export const modifyStory = (posts) => {
    return {
        type: 'MODIFY',
        newPosts: posts
    }
}

export const emptyStory = () => {
    return {
        type: 'EMPTY'
    }
}