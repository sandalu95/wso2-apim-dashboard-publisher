import React from 'react';
import PropTypes from 'prop-types';

/**
 * render the Custom Icon
 * @param {object} props - strokeColor, width, height, style
 * @return {ReactElement} iconBody
 * */
export default function CustomIcon(props) {
    let {
        strokeColor, width, height, style,
    } = props;
    strokeColor = strokeColor !== undefined ? strokeColor : '#8b8e95';
    width = width !== undefined ? width : 32;
    height = height !== undefined ? height : 32;
    style = style !== undefined ? style : '';

    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width={width}
            height={height}
            viewBox='0 0 6.5989004 6.5674281'
            id='svg8'
            style={style}
        >
            <g id='layer25' transform='translate(35.929 -86.734)'>
                <g transform='matrix(.66392 0 0 .66392 -39.893 53.694)' id='g10459' strokeLinecap='round'>
                    <circle
                        id='circle10453'
                        cx='8.138'
                        cy='57.583'
                        r='1.497'
                        fill={strokeColor}
                        strokeWidth='0.529'
                        strokeLinejoin='round'
                    />
                    <path
                        d='m 6.6416492,53.373914 c 2.7091648,-0.363432 5.5994938,2.122181 5.7062048,5.612659'
                        id='path10455'
                        fill='none'
                        stroke={strokeColor}
                        strokeWidth='1.323'
                    />
                    <path
                        id='path10457'
                        d='m 6.7351935,50.47404 c 5.1370835,-0.52388 7.9751195,3.245055 8.5125345,8.512533'
                        fill='none'
                        stroke={strokeColor}
                        strokeWidth='1.323'
                    />
                </g>
            </g>
        </svg>
    );
}

CustomIcon.propTypes = {
    strokeColor: PropTypes.string.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    style: PropTypes.shape({}).isRequired,
};
