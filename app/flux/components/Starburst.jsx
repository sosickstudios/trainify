/**
 * app/flux/components/Starburst.react
 *
 */
"use strict";

const d3 = require('d3');
const React = require('react');


// Dimensions of sunburst.
var height = 300;
var width = 450;

var radius = Math.min(width, height) / 2;

var colors = {
    standard: '#31c5f1',
    caution: '#fdd53c',
    passing: '#9fcc46',
    failing: '#f68421'
};

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 200, h: 30, s: 5, t: 10
};

// Total size of all segments; we set this later, after loading the data.
var totalSize = 0;

var clickLock = false;
var currentCategory;

/**
 * Generate a string that describes the points of a breadcrumb polygon.
 *
 * @param {Category} d partition that is describing the polygon.
 * @param {Number} i index that is being described
 * @return {String} points of the polygons for the svg area.
 */
function breadcrumbPoints(d, i) {
    var points = [];
    points.push('0,0');
    points.push(b.w + ',0');
    points.push(b.w + b.t + ',' + (b.h / 2));
    points.push(b.w + ',' + b.h);
    points.push('0,' + b.h);

    // Leftmost breadcrumb; don't include 6th vertex.
    if (i > 0) {
        points.push(b.t + ',' + (b.h / 2));
    }
    return points.join(' ');
}

/**
 * Determine the fill color for a node on the starburst based on the data.stats.average
 *
 * @param {Category} d The category that has a stats object attached.
 * @return {String}    Should return the string of the color to be used for filling.
 */
function determineFillColor (d){
    var average = d.data.stats.average;

    if(average === -1){
        return colors.standard;
    } else if(average <= 50){
        return colors.failing;
    } else if(50 < average && average <= 80){
        return colors.caution;
    } else if(average > 80){
        return colors.passing;
    }
}

/**
 * Get the path back to the root in the data tree, and return.
 *
 * @param {Category} node The partition that is currently selected from the data
 *                      tree.
 * @return {[Object]} Returns the array of ancestors, that leads back to the
 *                    root of the data tree.
 */
function getAncestors(node) {
    var path = [];
    var current = node;

    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }

    return path;
}

function getInitialStores(){
  return {
    currentCategory: null,
    percentageText: '',
    practiceButtonText: 'Select one of the categories',
    practiceButtonActive: false
  }
}

// TODO (Bryce) This should be hooked to dispatch for Dash so if data changes we have a refresh.
class StarBurst extends React.Component {

  constructor(props) {
    super(props);

    // Only lifecycle methods receive the inheritance from React.Component.
    this._onChange = this._onChange.bind(this);
    this.createVisualization = this.createVisualization.bind(this);
    this.initializeBreadcrumbTrail = this.initializeBreadcrumbTrail.bind(this);
    this.initializeSVG = this.initializeSVG.bind(this);
    this.mouseleave = this.mouseleave.bind(this);
    this.mouseover = this.mouseover.bind(this);
    this.updateBreadcrumbs = this.updateBreadcrumbs.bind(this);
    this._onPracticeButtonClick = this._onPracticeButtonClick.bind(this);

    this.state = getInitialStores();
  }

  componentDidMount() {
    // TODO (BRYCE) - This needs to come from data stores and load in state.
    var { matrix } = this.props.stats;

    // The Starburst container that D3 will use.
    this.el = React.findDOMNode(this);

    // Initialize the SVG
    this.initializeSVG();

    // Once mounts, initialize Starburst
    this.createVisualization(matrix);
  }

  render () {

    var buttonClasses = this.state.practiceButtonActive ? 'active' : '';

    var { percentageText, practiceButtonText } = this.state;

    return (
      <div id="starburst">
        <div id="sequence"></div>
        <div id="chart">
            <div id="explanation">
                <button className={buttonClasses} onClick={this._onPracticeButtonClick}>
                  <span id="percentage">{percentageText}</span>
                  <span id="buttonText">{practiceButtonText}</span>
                </button>
            </div>
        </div>
      </div>
    );
  }

  /**
   * Responsible for rendering the starburst based on the data tree that is
   * passed in.
   *
   * @param {Category} json Data tree sent in to be rendered, should have the parent-child format.
   */
  createVisualization(json) {

      // Basic setup of page elements.
      this.initializeBreadcrumbTrail();

      // Bounding circle underneath the sunburst, to make it easier to detect
      // when the mouse leaves the parent g.
      this.vis.append('svg:circle')
          .attr('r', radius)
          .style('opacity', 0);

      // For efficiency, filter nodes to keep only those large enough to see.
      var nodes = this.partition.nodes(json)
          .filter(function(d) {
              // 0.005 radians = 0.29 degrees
              return (d.dx > 0.005);
          });

      var path = this.vis.data([json]).selectAll('path')
          .data(nodes)
          .enter().append('svg:path')
          .attr('display', function(d) { return d.depth ? null : 'none'; })
          .attr('d', this.arc)
          .attr('fill-rule', 'evenodd')
          .style('fill', function(d){
              return determineFillColor(d);
          })
          .style('opacity', 1)
          .on('mouseover', this.mouseover)
          .on('click', function () {
              // Any time they click on the starburst paths, we want to flip the lock flag.
              clickLock = !clickLock;
          });

      // Add the mouseleave handler to the bounding circle.
      d3.select(this.el).select('#container').on('mouseleave', this.mouseleave);

      // Get total size of the tree = value of root node from partition.
      totalSize = path.node().__data__.value;
  }

  /**
   * Responsible for initiating the svg space in which the breadcrumbs will
   * render.
   */
  initializeBreadcrumbTrail() {
    // Add the svg area.
    var trail = d3.select(this.el).select('#sequence')
        .append('svg:svg')
        .attr('width', 650)
        .attr('height', 50)
        .attr('id', 'trail');
  }

  initializeSVG() {

    this.vis = d3.select(this.el).select('#chart').append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .append('svg:g')
        .attr('id', 'container')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    this.partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function(d){
            // HACK(BRYCE) We should scale this according to how the d.data.stats.average is.
            return 100;
        });

    this.arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
  }

  /**
   * Once the mouse is no longer hovered over the partition, restore opacity
   * so that the user may once again choose a partition.
   *
   * @param {Category} d The partition that was previously hovered over.
   */
  mouseleave(d) {
      // TODO (BRYCE) Tie into action creator.
      if (clickLock) {
          return;
      }

      // Hide the breadcrumb trail
      d3.select(this.el).select('#trail')
          .style('visibility', 'hidden');

      // Deactivate all segments during transition.
      d3.select(this.el).selectAll('path')
          .on('mouseover', null);

      var self = this;
      // Transition each segment to full opacity and then reactivate it.
      d3.select(this.el).selectAll('path')
          .transition()
          .duration(250)
          .style('opacity', 1)
          .each('end', function() {
              d3.select(this).on('mouseover', self.mouseover);
          });

      this.setState(getInitialStores());
  }

  /**
   * When the user mouses over one of the partitions in the starburst,
   * this callback will fire. If the clickLock is true, the function should
   * simply return to avoid taking focus off the category the user has chosen.
   *
   * @param {Category} d The data for the current partition that is hovered over.
   */
  mouseover(d) {
      // TODO (Bryce) Tie into action creator.

      // Make sure we don't continue if the user clicked on another partition.
      if (clickLock) {
          return;
      }

      currentCategory = d;
      var percentageString;
      if(currentCategory.data.stats.average !== -1) {
          percentageString = currentCategory.data.stats.average + '%';
      } else {
          percentageString = 'N/A';
      }

      this.setState({
        percentageText: percentageString,
        practiceButtonText: d.name,
        practiceButtonActive: true,
        currentCategory: currentCategory
      });


      d3.select('#explanation')
          .style('visibility', 'visible');

      // Find the path back to the root from the current moused over partition.
      var sequenceArray = getAncestors(d);
      this.updateBreadcrumbs(sequenceArray, percentageString);

      // Fade all the segments.
      d3.selectAll('path')
          .style('opacity', 0.3);

      // Then highlight only those that are an ancestor of the current segment.
      this.vis.selectAll('path')
          .filter(function(node) {
              return (sequenceArray.indexOf(node) >= 0);
          })
          .style('opacity', 1);
  }

  /**
   * Update the breadcrumb trail to show the current sequence and percentage.
   *
   * @param {[Category]} nodeArray path of polygons that will represent the trail.      * (Category)
   */
  updateBreadcrumbs(nodeArray) {

      // Data join; key function combines name and depth (= position in sequence).
      var g = d3.select(this.el).select('#trail')
          .selectAll('g')
          .data(nodeArray, function(d) { return d.name + d.depth; });

      // Add breadcrumb and label for entering nodes.
      var entering = g.enter().append('svg:g');

      entering.append('svg:polygon')
          .attr('points', breadcrumbPoints)
          .style('fill', function(d) {
              return determineFillColor(d);
          });

      entering.append('svg:text')
          .attr('x', (b.w + b.t) / 2)
          .attr('y', b.h / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .text(function(d) { return d.name; });

      // Set position for entering and updating nodes.
      g.attr('transform', function(d, i) {
          return 'translate(' + i * (b.w + b.s) + ', 0)';
      });

      // Remove exiting nodes.
      g.exit().remove();

      // Make the breadcrumb trail visible, if it's hidden.
      d3.select(this.el).select('#trail')
          .style('visibility', 'visible');
  }

  /**
   * If one of the data stores emits a change, this callback is used to retrieve the new data for
   * this component.
   *
   */
  _onChange() {
    this.setState(getInitialStores());
  }

  _onPracticeButtonClick() {
    var categoryId = this.state.currentCategory.id;
    var trainingId = this.props.training.id;

    this.context.router.transitionTo('exercise', {}, {
      type: 'Practice',
      tree: 'matrix',
      category: categoryId,
      trainingId: trainingId
    });
  }
}

StarBurst.contextTypes = {
  router: React.PropTypes.func
};

StarBurst.propTypes = {
  stats: React.PropTypes.object,
  training: React.PropTypes.object
};

module.exports = StarBurst;
