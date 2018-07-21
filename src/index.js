import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import DocumentTitle from 'react-document-title';
import reducer from './reducers/index.js';
import './styles/index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
//<img style={{maxWidth: '100%'}} src={banner} alt="Fast ain't it"/>
let store = createStore(reducer, applyMiddleware(thunk));

ReactDOM.render(
	<Provider store={store}>
		<Router>
			
			<div>
				<Route exact path="/e" render={() => 
					<DocumentTitle title={'Collaboration Treehouse'}>
					<div >
						<div style={{textAlign: 'center', padding: '20px'}}>
							
						</div>
						<div style={{paddingTop: '1em', textAlign: 'center', fontSize: '-webkit-xxx-large'}}>
							Awesome Totally Awesome
						</div>
						<div style={{padding: '1em', textAlign: 'center', fontSize: 'large'}}>
							Coming January 2018
						</div>
					</div>
					</DocumentTitle>
				}/>
				<Route path="/" component={App}/>
			</div>
		</Router>
	</Provider>,
	document.getElementById('root')
);
registerServiceWorker();
