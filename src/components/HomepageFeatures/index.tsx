import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<'svg'>>;
  Img?: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Defend your code solutions',
    Svg: require('@site/static/img/shield.svg').default,
    description: (
      <>
        Ngx-testbox protects your codebase from human mistakes and decouples tests from code.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/goal.svg').default,
    description: (
      <>
          Ngx-testbox makes black-box testing simple—focus on features, not code.
      </>
    ),
  },
  {
    title: 'Powered by Angular',
    Img: require('@site/static/img/logo.png').default,
    description: (
      <>
          Ngx-testbox enhances your development experience in Angular apps.
      </>
    ),
  },
];

function Feature({title, Svg, Img, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
          {Svg && <Svg className={styles.featureSvg} role="img" />}
          {Img && <img src={Img} className={styles.featureSvg} role="img" />}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
