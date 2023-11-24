from random import shuffle

from django.db.models import Max

from .models import EliminationSessionUser


def assign_anonymous_nickname(elimination_session):
    """
    Assigns anonymous nickname based on user count

    :param elimination_session: The elimination session the user is joining
    :type elimination_session: EliminationSession
    :return: "User {session_user_count}"
    :rtype: str
    """
    session_user_count = EliminationSessionUser.objects.filter(
        elimination_session=elimination_session).count()

    return f"User {session_user_count}"


def end_of_queue_position(elimination_session):
    """
    Returns maximum queue position + 1 for the current round

    :param elimination_session: The elimination session to get the end of queue position for
    :type elimination_session: EliminationSession
    :return: Last queue position + 1
    :rtype: int
    """
    position_dict = EliminationSessionUser.objects.filter(
        elimination_session=elimination_session).aggregate(last_position=Max('position'))
    return position_dict['last_position'] + 1


def assign_round_order(elimination_session):
    """
    Assigns the next round order for an elimination session and returns 
    the first user in the queue and a dictionary of active user's with 
    updated positions.

    :param elimination_session: The elimination session to get the next user in the queue for
    :type elimination_session: EliminationSession
    :return: First eliminating user and active user list
    :rtype: EliminationSessionUser, list[dict[str, int, str]]
    """
    # Active Session Users Queryset
    active_session_users_qs = EliminationSessionUser.objects.filter(
        elimination_session=elimination_session, is_active=True).select_related('persona')

    # If initial round, randomize the position of all active users
    if not elimination_session.is_active:
        all_active_users = list(active_session_users_qs.all())
        shuffle(all_active_users)
        elimination_session.is_active = True

    # If later round, first assign newly joined active users. Then assign remaining
    # active users in order of position
    else:
        # Start the list with newly joined users and then add the remaining users from the previous round
        all_active_users = list(active_session_users_qs.order_by(
            'position', 'updated_at').all())

    # Assign new position to each user, and build dictionary of user uuids and positions
    updated_positions = []
    n = 1
    for user in all_active_users:
        user.has_eliminated = False
        user.position = n
        updated_positions.append(
            {"uuid": user.persona.uuid, "position": n, "nickname": user.nickname})
        n += 1

    # Update active users positions
    EliminationSessionUser.objects.bulk_update(
        all_active_users, ['has_eliminated', 'position'])

    # Reset inactive users positions
    EliminationSessionUser.objects.filter(elimination_session=elimination_session, is_active=False).update(
        has_eliminated=False, position=0)

    # Update Turn
    elimination_session.turn = 1
    elimination_session.save()

    return all_active_users[0], updated_positions


def select_next_eliminating_user(elimination_session):
    """
    Returns the next user in the queue (whose position is >= the current turn).
    If the end of the queue is reached, it calls the assign_round_order function to
    assign the next round order, and also returns a dictionary of user positions.

    :param elimination_session: The elimination session to get the next user in the queue for
    :type elimination_session: EliminationSession
    :return: Tuple of next eliminating user and list of user info if updated
    :rtype: EliminationSessionUser, dict[str, int] | None
    """

    updated_positions = None

    # Gets the next user in this round if any
    next_eliminating_user = EliminationSessionUser.objects.filter(
        elimination_session=elimination_session,
        is_active=True,
        position__gt=elimination_session.turn
    ).order_by('position').first()

    # If no more users in this round, assign next round order
    if next_eliminating_user == None:
        next_eliminating_user, updated_positions = assign_round_order(elimination_session)
    else:
        # Update current turn
        elimination_session.turn = next_eliminating_user.position
        elimination_session.save()

    return next_eliminating_user, updated_positions
