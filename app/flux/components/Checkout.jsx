/**
 * app/flux/components/Checkout.react
 *
 */
'use strict';

const React = require('react');
const StoreAPI = require('../API/StoreAPI');
const UserStore = require('../stores/UserStore');

class Checkout extends React.Component{
    constructor (props){
        super(props);

        // Only lifecycle methods receive the inheritance from React.Component.
        this._onChange = this._onChange.bind(this);

        this.state = {
            stripe: null,
            training: null,
            user: UserStore.user
        };
    }

    componentDidMount (){
        UserStore.addChangeListener(this._onChange);

        // TODO(BRYCE) So hacky
        if (!this.state.user && UserStore.isPending){
            setTimeout(() =>{
                if (!this.state.user){
                    this.context.router.transitionTo('signup');
                }
            }, 800).bind(this);
        } else if (!this.state.user){
            this.context.router.transitionTo('signup');
        }

        var trainingId = this.context.router.getCurrentParams().id;
        StoreAPI.get.checkout(trainingId).then(response =>{
            /**
             * stripe: string,
             * training: object
             */
            var { stripe, training } = response;
            this.setState({
                stripe: stripe,
                training: training
            });
        });
    }

    componentWillUnmount (){
        UserStore.removeChangeListener(this._onChange);
    }

    render (){
        const { stripe, training, user } = this.state;

        if (!training){
            return <div></div>;
        }

        return (
            <main className="checkout">
                <form action={'/api/buy/' + training.id} method="post">
                    { training.cost ?
                        <div>
                            Would you like to buy <span className="course">{training.name}</span> for {training.cost}?

                            <script
                                    src="https://checkout.stripe.com/checkout.js" className="stripe-button"
                                    data-key={stripe}
                                    data-image="/images/logo.svg"
                                    data-name="Trainify"
                                    data-email={user.email}
                                    data-description={'1 course ($' + training.cost + '.00)'}
                                    data-amount="{{total}}00">
                            </script>
                        </div> :
                        <div>
                            Would you like to access <span className="course">{training.name}</span>? Don't worry, it's free during our beta period.
                            <br/>
                            <button type="submit" className="stripe-button-el">Access the course</button>
                        </div> }
                </form>
            </main>
        );
    }

    _onChange (){
        this.setState({user: UserStore.user});
    }
}

Checkout.contextTypes = {
  router: React.PropTypes.func
};

module.exports = Checkout;
