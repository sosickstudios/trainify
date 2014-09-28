/**
 * Determine how many times a user has been exposed to a certain question and weight accordingly.
 *
 * @param {Question} question Question to determine exposure weight for.
 * @param {Object} data Arbitrary data sent in for use in calculations.
 */
function Exposure (question, data){

    var priorityWeight = 5;
    var questionAnswers = question.results

    var exposureCount = questionAnswers.length;

    /**
    *  Tiering system
    *  
    *  Our scale will increase by means of 5 points for each area we wish to add in.
    *  Exposure will be responsible for 5 points, percentage another 5 points, etc
    *
    *  Exposure Granularity Expression: granularity = (5 / highestExposureCount).toFixed(2)
    *  Exposure Properties: {
    *
    *    ***Lowest Priority***                  ***Highest Priority***
    *    highestExposureCount >= exposureCount >= lowestExposureCount
    *
    *    | expression | = Math.abs(expression) // Absolute Value
    *    Equation: exposurePriorityWeight = 
    *        | (exposureCount - highestExposureCount) | * exposureGranularity
    *  }
    *
    *  Priority Weight Expression: priorityWeight = 
    *      exposurePriorityWeight + percentagePriorityWeight; [0,10]  
    */

    if (exposureCount){

        var granularity = (5 / data.highestExposureCount).toFixed(2);

        // Range [0,5]
        priorityWeight = (Math.abs(exposureCount - data.highestExposureCount) * granularity);  
    }

    return priorityWeight;
}

module.exports = exports = Exposure;