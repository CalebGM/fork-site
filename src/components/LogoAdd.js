/* eslint import/no-webpack-loader-syntax: off */

import React from 'react';
import loadImage from 'blueimp-load-image';
import ReactCrop from 'react-image-crop';
import ShowLoading from './ShowLoading.js';
import '!style-loader!css-loader!react-image-crop/dist/ReactCrop.css';
import styles from '../styles/mediaStyles.css';

class LogoAdd extends React.Component {
	
	constructor(props) {
		super(props);
        this.state = {
            logo: props.logo ? props.logo : null,
            url: '',
            open: false,
            inCrop: false,
            loading: false,
            crop: { aspect: 151 / 133, height: 10, x: 1, y: 1 },
            error: false
        };
		this.onClick = this.onClick.bind(this);
		this.getLocalImg = this.getLocalImg.bind(this);
		this.cropLogo = this.cropLogo.bind(this);
        this.startCrop = this.startCrop.bind(this);
        this.sendCropError = this.sendCropError.bind(this);
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
        this.setState({ open: false, loading: true });
        var loadingImage = loadImage(
            e.target.files[0],
            (img) => this.addLocalImage(img),
            { orientation: true }
        );
	}
	
    addLocalImage(localImage) {
        const { onChange } = this.props;
        localImage.toBlob((blob) => {
            var newLogo = { original: URL.createObjectURL(blob), file: blob };
            onChange(newLogo);
            this.setState({ url: '', open: false, loading: false, logo: newLogo, error: false });
        }, 'image/jpeg', 0.5);
        
	}
	
	
	addOnlineMedia () {
		const {onChange} = this.props;
		var newLogo = { original: this.state.url };
		onChange(newLogo);
		this.setState({ url: '', logo: newLogo, error: false });
	}
	
	changeUrl(event) {
		this.setState({ url: event.target.value });
	}
	
	
    startCrop() {
        if (!this.state.error) {
            this.setState({ inCrop: true });
            document.body.style.touchAction = 'none';
        } else {
            alert('Image cannot be cropped. Download locally and upload from your computer');
        }
    }

    sendCropError() {
        document.body.style.touchAction = 'auto';
        this.setState({ inCrop: false, error: true },
            () => alert('Image cannot be cropped. Download locally and upload from your computer'));
    }

	cancelCrop() {
        this.setState({ inCrop: false });
        document.body.style.touchAction = 'auto';
	}
	
    cropLogo() {
        const { logo, pixelCrop, image } = this.state;
        const { onChange } = this.props;

        const canvas = document.createElement('canvas');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );
        canvas.toBlob((blob) => {
            var newLogo = { original: URL.createObjectURL(blob), file: blob };
            onChange(newLogo);
            this.setState({ logo: newLogo, inCrop: false, crop: { aspect: 151/133, height: 20, x: 1, y: 1 } });
            document.body.style.touchAction = 'auto';
        }, 'image/jpeg', 0.5);
   
	}
	
	
	
	render() {
        const { logo, inCrop } = this.state;
		const imageImage = (<i className="fa fa-photo"></i>);
		
		const chooseMedia = this.state.open ? styles.popoverOpen : styles.popoverClosed;
		const addUrl = this.state.open ? styles.urlOpen : styles.urlClosed;
		
		let logoDiv;
		if (logo && inCrop) {
			logoDiv = (
                <div className={styles.Cropper}>
                    <ReactCrop
                        src={logo.original}
                        onImageLoaded={(image) => { this.setState({ image }); }}
                        onChange={(crop, pixelCrop) => { this.setState({ crop, pixelCrop }); }}
                        onImageError={this.sendCropError}
                        crossorigin={"Anonymous"}
                        crop={this.state.crop}
                    />
					<div className={styles.CropOptions}>
                        <button style={{ color: 'white', marginBottom: '20px' }} type="button" onClick={this.cropLogo}><i className="fa fa-crop" aria-hidden="true"></i></button>
                        <button style={{ color: 'red' }} type="button" onClick={this.cancelCrop}><i className="fa fa-close"></i></button>
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
                                    accept="image/*"
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
                <ShowLoading loading={this.state.loading} />
			</div>
		)
	}
	
}

export default LogoAdd;