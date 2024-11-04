mode track
historique ana alertes, 
historique de deplacement

amin'ny alerte afaka jerena le parametre en vigueur

tsy misy crud na matériel fafana sns: 

Rehefa creena le device de asina queue mamafa anazy ra ts défini ny localisation gps any, asina icon par défaut


fafana afaka 30 andro
avoka pdf le historique 


Changer numéro du serveur, 
Changer le paramètre waiting time for queue
changer paramètre frequency of track

add event for: 
device position confirmation, 
and the track device location 


format message for confirmation: 

C:Longitude:Latitude

  @Column({ default: false })
  activated?: boolean;
  is to activate/deactivate the device
  need to implement this view;


  need to add a queue for the activated change, -> Done



  points à ajouter, 
  prendre en compte le temps de réponse pour n'envoyer qu'une requête dans le laps de temps donné -> Done



Format message device activation: 
X:status(0/1)


ADD a QUEUE for device need verification -> Done

THE STOP ALERT MUST IMPLEMENTS A QUEUE TOO -> Done

Add the query queue at the top so if there is an instane don't do all the code -> Done



test the delete method on device -> done

IMPLEMENTER LE TRACK dans le code: 

add attribute tracked to the device element
the frequency is just sent by message and is not stored inside the database, or do i need to store it?

i don't think so

if memory is full in case of no sms message available, set the status of the device as untracked and show credit blink on the view
 
There is a problem wiht the current implementation of the trackQueue, 
The distinction between the case where the device does not respond and the delay is end are the same, need to implement a different method



NEED TO REIMPLEMENT THE  private async handleNotification(notification: string, deviceNumber: string) {
    if (["NT", "NS", "NL"].includes(notification)) {

      get all the implementation and then get all cases



NEED TO TEST ALL THE QUEUES



"T" Belongs to track device

handleTrackDevice(

){
  params are longitude and latitude 
}

TSY MAINTSY ASINA PARAMS DATE FONA ZE INPUT FA MANAHIRANA RA TS MISY SATRIA TSY HAY NY DATE N'INY, TSY MAKA NEW DATE FA MAKA ANLE DATE PARAMS AMLE MESSAGE

GENERAL FORMAT OF MESSAGE: 
CODE:Date:Message


HANDLETACKDEVICE REMAIN TO confirm to not delete the queue, TR

deviceLocationHandler remain to get device location while tracking

create a function trackBegan in the arduino 
format returned
CODE:Date:longitude:latitude

format send: CODE:duration:frequency

The track is finished -> DONE 

the track does not implement the frequency of track on the device


field the function activatePower

Paramètres: 
Changer mot de passe, reset password, 
Changer les paramèetres de queue, timeout,
Changer numéro du serveur


APIANA GRAPH NY HISTORIQUE D'ALERTE SY EXPORTATION PDF NY Etat mensue

add the message error if a queue is already connected -> done

for the latitude and longitude use . instead of , for separator

Avadika association le table history sy device

don't send message of confirmation if there is no message, almost the message will not changing anything



UPDATING THE CONFIG IS DONE

// RESTE

implement the code for storing data in EEPROM
implement the get GPS data split
implement the case there is credit and need to transform credit to offer; -> 
Don't need this, just check if the server sent an offer


Ajouter une fonction dans le frontend pour afficher le status du device
seuil, limites etc, dans le cas ou les instructions ont été envoyés mais 
le device n'a pas répondu à temps

Seules les alertes et les positions gps sont stocké en mémoires, 

la confirmation de l'envoi du message doit être envoyé avant que les paramètres soit changés
si le message n'est pas renvoyé, on ne change pas les paramètres


Créer une table pour stocker les erreurs ,
les champs d'erreurs à définir, 


enlever le champs processed dans history_device;





FARANY: AMBOARINA NY DELAI isakin'ny queue rapitso marainang serve