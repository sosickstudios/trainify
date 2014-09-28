(function (){
    // Dimensions of sunburst.
    var width = 450;
    var height = 300;
    var radius = Math.min(width, height) / 2;
    var originalButtonTxt = document.querySelector('#buttonText').innerHTML;

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

    var vis = d3.select('#chart').append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .append('svg:g')
        .attr('id', 'container')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function(d){
            // HACK(BRYCE) We should scale this according to how the d.data.stats.average is.
            return 100;
        });

    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

    var clickLock = false;
    var currentCategory;

    /**
     * Determine the fill color for a node on the starburst based on the data.stats.average
     *
     * @param {Category} d The category that has a stats object attached.
     * @return {String}	   Should return the string of the color to be used for filling.
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
     * Responsible for rendering the starburst based on the data tree that is
     * passed in.
     *
     * @param {Category} json Data tree sent in to be rendered, should have the parent-child format.
     */
    function createVisualization(json) {
        // Basic setup of page elements.
        initializeBreadcrumbTrail();

        // Bounding circle underneath the sunburst, to make it easier to detect
        // when the mouse leaves the parent g.
        vis.append('svg:circle')
            .attr('r', radius)
            .style('opacity', 0);

        // For efficiency, filter nodes to keep only those large enough to see.
        var nodes = partition.nodes(json)
            .filter(function(d) {
                // 0.005 radians = 0.29 degrees
                return (d.dx > 0.005);
            });

        var path = vis.data([json]).selectAll('path')
            .data(nodes)
            .enter().append('svg:path')
            .attr('display', function(d) { return d.depth ? null : 'none'; })
            .attr('d', arc)
            .attr('fill-rule', 'evenodd')
            .style('fill', function(d){
                return determineFillColor(d);
            })
            .style('opacity', 1)
            .on('mouseover', mouseover)
            .on('click', function () {
                // Any time they click on the starburst paths, we want to flip the lock flag.
                clickLock = !clickLock;
            });

        // Add the mouseleave handler to the bounding circle.
        d3.select('#container').on('mouseleave', mouseleave);

        // Get total size of the tree = value of root node from partition.
        totalSize = path.node().__data__.value;
    }

    var courseData;
    // Attach a listener for when the data is loaded or changed/refreshed.
    window.Trainify.attachCourseDataListener(function (data){
        courseData = data;
        createVisualization(data.stats.trees['matrix']);
    });

    /**
     * When the user mouses over one of the partitions in the starburst,
     * this callback will fire. If the clickLock is true, the function should
     * simply return to avoid taking focus off the category the user has chosen.
     *
     * @param {Category} d The data for the current partition that is hovered over.
     */
    function mouseover(d) {
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

        d3.select('#percentage')
            .text(percentageString);

        d3.select('#buttonText')
            .text(d.name);

        document.querySelector('#buttonText').classList.add('active');

        d3.select('#practiceButton')
            .on('click', function () {
                var constPath = '/exercise?type=Practice&tree=matrix&';
                var path = 'category=' + currentCategory.id + '&trainingId=' + courseData.id;
                location.href = constPath + path;
            });

        d3.select('#explanation')
            .style('visibility', 'visible');

        // Find the path back to the root from the current moused over partition.
        var sequenceArray = getAncestors(d);
        updateBreadcrumbs(sequenceArray, percentageString);

        // Fade all the segments.
        d3.selectAll('path')
            .style('opacity', 0.3);

        // Then highlight only those that are an ancestor of the current segment.
        vis.selectAll('path')
            .filter(function(node) {
                return (sequenceArray.indexOf(node) >= 0);
            })
            .style('opacity', 1);
    }

    /**
     * Once the mouse is no longer hovered over the partition, restore opacity
     * so that the user may once again choose a partition.
     *
     * @param {Category} d The partition that was previously hovered over.
     */
    function mouseleave(d) {
        if (clickLock) {
            return;
        }

        // Hide the breadcrumb trail
        d3.select('#trail')
            .style('visibility', 'hidden');

        // Deactivate all segments during transition.
        d3.selectAll('path')
            .on('mouseover', null);

        // Transition each segment to full opacity and then reactivate it.
        d3.selectAll('path')
            .transition()
            .duration(250)
            .style('opacity', 1)
            .each('end', function() {
                d3.select(this).on('mouseover', mouseover);
            });

        //d3.select('#explanation')
        //	.style('visibility', 'hidden');
        document.querySelector('#percentage').textContent = '';

        document.querySelector('#buttonText').innerHTML = originalButtonTxt;
        document.querySelector('#buttonText').classList.remove('active');
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

    /**
     * Responsible for initiating the svg space in which the breadcrumbs will
     * render.
     */
    function initializeBreadcrumbTrail() {
        // Add the svg area.
        var trail = d3.select('#sequence').append('svg:svg')
            .attr('width', 650)
            .attr('height', 50)
            .attr('id', 'trail');
    }

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
     * Update the breadcrumb trail to show the current sequence and percentage.
     *
     * @param {[Category]} nodeArray path of polygons that will represent the trail.      * (Category)
     */
    function updateBreadcrumbs(nodeArray) {

        // Data join; key function combines name and depth (= position in sequence).
        var g = d3.select('#trail')
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
        d3.select('#trail')
            .style('visibility', 'visible');
    }
})();