import React from 'react';
import PropTypes from 'prop-types';
const YOUTUBE_PREFIX = 'https://www.youtube.com/embed/';
const VIMEO_PREFIX = 'https://player.vimeo.com/video/';

const YOUTUBEMATCH_URL = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
const VIMEOMATCH_URL = /https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;// eslint-disable-line no-useless-escape

const isYoutube = (url) => YOUTUBEMATCH_URL.test(url);
const isVimeo = (url) => VIMEOMATCH_URL.test(url);
const getYoutubeSrc = (url) => {
	const id = url && url.match(YOUTUBEMATCH_URL)[1];
    return {
      srcID: id,
      srcType: 'youtube',
      url,
    };
};
const getVimeoSrc = (url) => {
    const id = url.match(VIMEOMATCH_URL)[3];
    return {
      srcID: id,
      srcType: 'vimeo',
      url,
    };
};

const getSrc = ({ src }) => {

  if (isYoutube(src)) {
    const { srcID } = getYoutubeSrc(src);
    return `${YOUTUBE_PREFIX}${srcID}`;
  }
  if (isVimeo(src)) {
    const { srcID } = getVimeoSrc(src);
    return `${VIMEO_PREFIX}${srcID}`;
  }
  return undefined;
};

const ModifiedVideoWrapper = ({props}) => {
	console.log(props);
  const src = getSrc(props.blockProps);
  if (src) {
    return (
      <div style={props.style} >
        <div className='iframeContainer'>
          <iframe
            className='iframe'
            src={src}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  return (<div className='invalidVideoSrc'>invalid video soe</div>);
};

export default ModifiedVideoWrapper;