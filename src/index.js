import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import login from './reducers/login.js';
import './index.css';
import App from './App';
import spicoli from './spicoli championship.jpg';
import registerServiceWorker from './registerServiceWorker';

let store = createStore(login, applyMiddleware(thunk));

ReactDOM.render(
	<Provider store={store}>
		<Router>
			<div>
				<Route exact path="/" render={() => 
					<div >
						<div style={{textAlign: 'center', padding: '20px'}}>
							<img style={{maxWidth: '100%'}} src={spicoli} alt="Fast ain't it"/>
						</div>
						<div style={{paddingTop: '1em', textAlign: 'center', fontSize: '-webkit-xxx-large'}}>
							Awesome Totally Awesome
						</div>
						<div style={{padding: '1em', textAlign: 'center', fontSize: 'large'}}>
							Coming November 2017
						</div>
					</div>
				}/>
				<Route path="/realHome" component={App}/>
			</div>
		</Router>
	</Provider>,
	document.getElementById('root')
);
registerServiceWorker();
