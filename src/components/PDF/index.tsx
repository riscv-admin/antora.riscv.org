import React, { CSSProperties } from 'react';
import styles from './styles.module.css';
import clsx from 'clsx';
import Button from '@site/src/components/Button';
import useBaseUrl from '@docusaurus/useBaseUrl';


interface PdfProps {
  download: string;
  title: string;
  height?: string;
  width?: string;
}

export default function PDF({ download, title, height, width }: PdfProps) {
  const pdfWidth = width ? width : '100%';
  const pdfHeight = height ? height : '900px';
  return (
    <div>
      

      <button
                className={clsx(
                    'button',
                    'button--lg',
                    'button--secondary',
                    'button--outline',
                    'button--block',
                    'button--download'
                )}

                role='button'
            >
          <a href={useBaseUrl(download)} download={title}>Download the `{title}`</a>        
      </button>

      <object data={download} type="application/pdf" width={pdfWidth} height={pdfHeight} >
          <p>
            PDF not displaying? <a href={download}> Download it here.</a> 
          </p>
      </object>
    </div>
  );
}