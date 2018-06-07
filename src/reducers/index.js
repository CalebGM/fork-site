import { combineReducers } from 'redux';
import user from './user.js';
import story from './story.js';


export default combineReducers({
    user,
    story
})