import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';
import Logo from '@site/static/img/logo.svg'

type Props = {
    to: string;
    label: string;
};

export default function DocusaurusButton(props: Props): JSX.Element {
    return (
        <div className={clsx(styles.docusaurusButton, 'text--center')}>
            <p className="text--center">
                <Link className={clsx(styles.docusaurusButtonButton, 'button button--secondary button--lg')} to={props.to}>
                    <span className={styles.docusaurusButtonIcon}><Logo /></span>
                    <span className={styles.docusaurusButtonText}>{props.label}</span>
                </Link>
            </p>
        </div>
    );
}
