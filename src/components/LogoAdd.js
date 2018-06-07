import React from 'react';
import {Cropper} from 'react-image-cropper';
import styles from '../styles/mediaStyles.css';

class LogoAdd extends React.Component {
	
	constructor(props) {
		super(props);
		this.state = { logo: props.logo ? props.logo : null, url: '', open: false, crop: false };
		this.onClick = this.onClick.bind(this);
		this.getLocalImg = this.getLocalImg.bind(this);
		this.cropLogo = this.cropLogo.bind(this);
		this.startCrop = this.startCrop.bind(this);
		this.cancelCrop = this.cancelCrop.bind(this);
	}
	
	componentDidMount() {
		document.addEventListener('click', this.closePopover.bind(this));
	}
	
	componentWillUnmount() {
		document.removeEventListener('click', this.closePopover.bind(this));
	}
	
	
	onPopoverClick() {
		this.preventNextClose = true;
	}
	
	openPopover() {
		if(!this.state.open) {
			this.preventNextClose = true;
			this.setState({open: true});
		}
	}
	
	closePopover() {
		if(!this.preventNextClose && this.state.open) {
			this.setState({open: false});
		}
		
		this.preventNextClose = false;
	}
	
	
	onClick() {
		this.input.value = null;
		this.input.click();
	}
	
	
	getLocalImg(e) {
		e.preventDefault();
		const file = e.target.files[0];
		if (file.type.indexOf('image/') === 0) {
			const src = URL.createObjectURL(file);
			this.setState({ url: src },
				() => this.addLocalImage(file));
		}
	}
	
	addLocalImage(localImage) {
		const {onChange} = this.props;
		var newLogo = { original: this.state.url, file: localImage };
		onChange(newLogo);
		this.setState({ url: '', logo: newLogo });
	}
	
	
	addOnlineMedia () {
		const {onChange} = this.props;
		var newLogo = { original: this.state.url };
		onChange(newLogo);
		this.setState({ url: '', logo: newLogo });
	}
	
	changeUrl(event) {
		this.setState({ url: event.target.value });
	}
	
	dataURLtoBlob(dataurl) {
		var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
		while(n--){
			u8arr[n] = bstr.charCodeAt(n);
		}
		return new Blob([u8arr], {type:mime});
	}
	
	startCrop() {
		this.setState({ crop: true });
	}
	
	cancelCrop() {
		this.setState({ crop: false });
	}
	
	cropLogo() {
		const {onChange} = this.props;
		
		if (this.cropper.state.imgHeight === "auto") {
			alert('Image cannot be cropped. Download locally and upload from your computer');
			this.setState({ crop: false });
		} else {
			var cropBlob = this.dataURLtoBlob(this.cropper.crop());
			var newLogo = { original: this.cropper.crop(), file: cropBlob };
			onChange(newLogo);
			this.setState({ logo: newLogo, crop: false });
		}
	}
	
	
	
	render() {
		const { logo, crop } = this.state;
		const imageImage = (<i className="fa fa-photo"></i>);
		
		const chooseMedia = this.state.open ? styles.popoverOpen : styles.popoverClosed;
		const addUrl = this.state.open ? styles.urlOpen : styles.urlClosed;
		
		
		let logoDiv;
		if (logo && crop) {
			logoDiv = (
				<div className={styles.Cropper}>
					<Cropper
						src={logo.original}
						ref={i => this.cropper = i}
					/>
					<div style={{padding: '5px'}}>
						<button style={{marginRight: '5px'}} type="button" onClick={this.cropLogo}>Make Crop</button>
						<button style={{color: 'red'}} type="button" onClick={this.cancelCrop}>Cancel Crop</button>
					</div>
				</div>
			)
		} else if (logo) {
			logoDiv = (
				<div style={{display: 'inline-block'}}>
					<div className={styles.ShowLogo}>
						<img src={logo.original} alt="Empty Logo"/>
					</div>
					<div>
						<button type="button" onClick={this.startCrop}>Crop Logo</button>
					</div>
				</div>
			)
		} else {
			logoDiv = (
				<div className={styles.EmptyLogo}>
					<span>Add a Logo Image</span>
				</div>
			)
		}
		
		return (
			
			<div>
				<div className={styles.Logo}>
					{logoDiv}
				</div>
				<div className={styles.Input} >
					<button className={chooseMedia} onMouseUp={this.openPopover.bind(this)} type="button">{imageImage}</button>
					<div className={addUrl} onClick={this.onPopoverClick.bind(this)}>
						<div>
							<button type="button" style={{marginBottom: '5px'}} onClick={this.onClick}>
								<i className="fa fa-save"></i>
								<input 
									type="file" 
									ref={(input) => { this.input =input; }}
									onChange={this.getLocalImg}
									style={{display: "none"}}
								/>
							</button>
						</div>
					
						<div>
							<input type="text" placeholder="Paste the url...." style={{width: '88px'}} onChange={this.changeUrl.bind(this)} value={this.state.url} />
							<button className='addMedia' type="button" onClick={this.addOnlineMedia.bind(this)} >Add Image</button>
						</div>
						
					</div>
				</div>
			</div>
		)
	}
	
}

export default LogoAdd;