// imports
import { LightningElement, wire,api } from 'lwc';
import getAllReviews from '@salesforce/apex/BoatDataService.getAllReviews';
import { NavigationMixin } from 'lightning/navigation';

export default class BoatReviews extends NavigationMixin(LightningElement) {
    // Private
    boatId;
    error;
    boatReviews;
    isLoading=true;
    
    // Getter and Setter to allow for logic to run on recordId change
   @api get recordId() { 
        return this.boatId;
    }
    set recordId(value) {
      //sets boatId attribute
        this.boatId = value;
      //sets boatId assignment
      //get reviews associated with boatId
        this.getReviews();
    }
    
    // Getter to determine if there are reviews to display
    get reviewsToShow() { 
        
        if( this.boatReviews.length >0)
        {
            console.log('reviws to Show Called True');
            return true;
        }
        else
        {
            console.log('reviws to Show Called FalseS');
            return false;
        }
    }
    
    // Public method to force a refresh of the reviews invoking getReviews
    @api refresh() { 
        this.isLoading = true;
        this.getReviews();
    }
    
    // Imperative Apex call to get reviews for given boat
    // returns immediately if boatId is empty or null
    // sets isLoading to true during the process and false when it’s completed
    // Gets all the boatReviews from the result, checking for errors.
    getReviews() {
        getAllReviews({ boatId: this.boatId })
            .then(result=>{
                console.log('data-->',result);
                this.boatReviews =result;
                this.isLoading = false;
            }).catch(error=>{
                console.log('error occured',error);
                this.isLoading = false;
            })
     }
    
    // Helper method to use NavigationMixin to navigate to a given record on click
    navigateToRecord(event) { 
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.target.dataset.recordId,
                objectApiName: 'User',
                actionName: 'view'
            }
        });
     }
  }