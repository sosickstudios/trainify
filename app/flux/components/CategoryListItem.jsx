/**
 * app/flux/components/CategoryListItem.react
 */
'use strict';

const { Link } = require('react-router');
const React = require('react');

class CategoryListItem extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        const { category, trainingId } = this.props;
        const stats = category.data.stats;

        const hasAverages = category.hasAverages ?
            <span className={'average-indicator ' + stats.status}
                style={{width: stats.average + '%'}}>{stats.average + '%'}</span> :
                <span className="no-data">Take a practice exam to see stats for this category.</span>;

        return (
            <li className="about">
                <h2>
                    <Link to="exercise"
                        params = {{}}
                        query={{type: 'Practice',
                        tree: 'matrix',
                        category: category.id,
                        trainingId: trainingId}}>
                        {category.name}
                    </Link>
                </h2>
                <div className="stats">
                    { hasAverages }
                </div>
        </li>);
    }
}

CategoryListItem.propTypes = {
  category: React.PropTypes.object,
  trainingId: React.PropTypes.number
};

module.exports = CategoryListItem;
