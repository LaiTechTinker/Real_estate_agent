Using the Realtor Assistant

The main user experience is a chat widget. Open the app in your browser, select the chat button, type a message, and send it. You can write naturally; you don’t need special commands.

Finding properties

Tell the assistant the location and the features that matter to you. The supported search criteria are city, state, minimum bedrooms, minimum bathrooms, and a minimum or maximum price.

For example:

I’m looking for a home in Austin, Texas, with at least 3 bedrooms and 2 bathrooms, under $500,000.

You can refine the search in follow-up messages, such as:

Lower the maximum price to $450,000.

Or start a different search:

Now show me properties in Dallas with at least 2 bedrooms.

The current property database returns at most two results per search. Its stored fields are price, bedrooms, bathrooms, city, state, and ZIP code, so don’t expect details such as square footage, amenities, or property photos from the current search feature.

Managing appointments

You can ask to schedule, change, cancel, or check appointments. For a new appointment, give a specific date and time, the property or meeting location, and the attendee’s email address. The appointment assistant is instructed to ask for the email if you haven’t provided it.

For example:

I’d like to book a viewing for the property in Austin on October 12 at 2 PM. The attendee’s email is alex@example.com.

The app is intended to ask for confirmation before making, changing, or canceling a calendar event. However, that confirmation flow is inconsistent in the current code, so those actions may not complete reliably through the browser chat. The calendar connection also needs to be configured by the project owner.

Other ways to interact

The backend includes SMS and Retell voice endpoints, but those require their respective services and credentials to be configured. They aren’t automatically available just because you can open the web chat.

A few tips

Include the city and state to make property searches clearer.
State price limits and minimum bedroom or bathroom counts plainly.
Give an exact appointment date and time, and include an attendee email.
If the assistant doesn’t find what you need, try changing one search condition at a time.
These capabilities are reflected in the search and appointment code: search_criteria_agent.py, database_query_node.py, and appointment_agent.py.